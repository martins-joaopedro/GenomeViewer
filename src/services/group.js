import { elements } from "chart.js";
import { get } from "./graph"
import { getIsolationClassification, getClassificationFile } from "./classifications";

const sorting = (el1, el2) => el1.contig.localeCompare(el2.contig) || el1.start - el2.start;

export const getGroups = async ({ accessionsData, MINIMAL_ELEMENTS, MAXIMAL_DISTANCE }) => {
    
    const classificationFile = await getClassificationFile();
 
    let allGroupsByAccession = []
    accessionsData.forEach(({ accession, args, integrons, phages, is_digis, is_isescan, isolation_source }) => {

        let elements = [ ...args, ...integrons, ...phages, ...is_digis ]

        // não há elementos para processar
        if (elements.length === 0) {
            allGroupsByAccession.push({
                isolationSource: isolation_source,
                isolationClassification: getIsolationClassification(
                    isolation_source,
                    classificationFile
                ),
                accession,
                groups: []
            });

            return;
        }

        const sortedElements = [...elements].sort(sorting);
        let elementsNumber = sortedElements.length
        let first = sortedElements[0]
        let contig = first.contig
        let current_group = [first]
        let group_end = first.stop
        let group_start = first.start
        let groups = []

        for (let i=1; i<elementsNumber; i++) {
            let node = sortedElements[i]

            //mudança de contig - finaliza grupo atual e reinicia 
            if (node.contig != contig) {
                if(current_group.length >= MINIMAL_ELEMENTS)
                    groups.push({contig, elementos: current_group})
                contig = node.contig
                current_group = [node]
                group_start = node.start
                group_end = node.stop
            }
            else {
                
                const isOverlapping =
                    node.start <= group_end &&
                    node.stop >= group_start;

                const isCloseEnough =
                    node.start > group_end &&
                    node.start - group_end <= MAXIMAL_DISTANCE;

                //mesmo contig, se tiver na proximidade definida, ou dentro do elemento agrupa
                if (isOverlapping || isCloseEnough) {
                    current_group.push(node)
                    group_end = Math.max(group_end, node.stop)

                } 
                else {
                    //finaliza o grupo atual
                        if(current_group.length >= MINIMAL_ELEMENTS)
                            groups.push({contig, elementos: current_group})
                    
                    // começa um grupo no mesmo contig
                    current_group = [node]
                    group_start = node.start
                    group_end = node.stop
                }
            }
        }

        if(current_group.length >= MINIMAL_ELEMENTS)
            groups.push({contig, elementos: current_group})
            
        // add cada subgrupo em cada grupo
        groups.forEach(group => {
            const subgroups = checkGroupInRatio(group)
            group.subgroups = subgroups
        })
    
        const isolationClassification = getIsolationClassification(isolation_source, classificationFile)

        let groupData = {
            isolationSource: isolation_source,
            isolationClassification,
            accession,
            groups: groups,
        }

        allGroupsByAccession.push(groupData)
        
    });

    // limpa os accessions de grupos vazios
    let result = allGroupsByAccession.filter(({ accession, groups }) => groups.length) || []

    // pega todas as tags dos elementos
    let allElementsTag = new Set()
    result.forEach(({ groups }) => 
        groups.forEach(({ elementos }) => 
            elementos.forEach(({ classification }) => 
                allElementsTag.add(classification)
            )
        )
    )

    return {
        data: result,
        foundElements: allElementsTag
    }
}

// valida os grupos completos na relação de ARG + MGE no critério de 5KB
const checkGroupInRatio = ({ contig, elementos }) => {
    
    const MAXIMAL_DISTANCE = 5000;
    let geneSubgroups = []

    const sortedElements = [...elementos].sort(sorting);

    // cria subgrupos de genes
    sortedElements.forEach(element => {

        if (element.classification !== "gene") 
            return

        const minRange = Math.max(0, element.start - MAXIMAL_DISTANCE)
        const maxRange = element.stop + MAXIMAL_DISTANCE

        const last = geneSubgroups.at(-1)

        const isSameContig = last && last.contig === element.contig
        const isClose = last && element.start <= last.maxRange

        if (geneSubgroups.length > 0 && isSameContig && isClose) {
            last.elementos.push(element)

            // expande o range
            last.minRange = Math.min(last.minRange, minRange)
            last.maxRange = Math.max(last.maxRange, maxRange)

        } else {
            geneSubgroups.push({
                contig: element.contig,
                elementos: [element],
                minRange,
                maxRange,
            })
        }
    })

    if (!geneSubgroups.length) return null

    // agregar elementos que não sao genes e expande os ranges do grupo
    elementos.forEach(element => {

        if (element.classification === "gene") return

        for (let i = 0; i < geneSubgroups.length; i++) {
            let group = geneSubgroups[i]

            const isInside =
                element.contig === group.contig &&
                element.start <= group.maxRange &&
                element.stop >= group.minRange
        
            if (isInside) {
                group.elementos.push(element)
            }
        }
    })

    // validar subgrupos que devem ter ARG + MGE
    geneSubgroups = geneSubgroups.filter(group => {
        const hasGene = group.elementos.some(el => el.classification === "gene")
        const hasOther = group.elementos.some(el => el.classification !== "gene")
        return hasGene && hasOther
    })

    return geneSubgroups.map(sub => ({
        contig: sub.contig,
        elementos: sub.elementos
    }))
}