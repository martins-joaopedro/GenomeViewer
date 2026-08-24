import { get } from "./graph"
import { getIsolationClassification, getClassificationFile } from "./classifications";

const sorting = (el1, el2) => el1.contig.localeCompare(el2.contig) || el1.start - el2.start;

export const getGroups = async ({ accessionsData, MAXIMAL_DISTANCE }) => {
    
    const classificationFile = await getClassificationFile();
 
    let allGroupsByAccession = []
    accessionsData.forEach(({ accession, args, integrons, phages, is_digis, is_isescan, isolation_source }) => {

        let elements = [ ...args, ...integrons, ...phages, ...is_digis ]

        if (elements.length === 0) return;

        const sortedElements = [...elements].sort(sorting);
        let elementsNumber = sortedElements.length
        let first = sortedElements[0]
        let contig = first.contig
        let current_group = [first]
        let groups = []
        
        // cria todos os grupos no critério de estar no mesmo contig
        for (let i=1; i<elementsNumber; i++) {
            let node = sortedElements[i]

            //mudança de contig - finaliza grupo atual e reinicia 
            if (node.contig != contig) {
                
                groups.push({contig, elementos: current_group})
                contig = node.contig
                current_group = [node]
            }
            else {
                current_group.push(node)
            }
        }

        // adiciona o ultimo grupo
        groups.push({contig, elementos: current_group})
            
        // adiciona cada subgrupo em cada grupo nos critérios de distancia
        groups.forEach(group => {
            const subgroups = checkGroupInRatio(group, MAXIMAL_DISTANCE)
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

    let result = allGroupsByAccession
    /* // filtra os genomas que não possuem nenhum subgrupo
    let result = allGroupsByAccession
    .map(item => {

        // grupos válidos tem subgrupos válidos
        const validGroups = item.groups.filter(
            ({ subgroups }) => subgroups?.length >= 0
        )

        return {
            ...item,
            groups: validGroups
        }
    })
    .filter(({ groups }) => groups.length > 0) */

    //console.log(result.length)

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
const checkGroupInRatio = ({ contig, elementos }, MAXIMAL_DISTANCE) => {
    
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

    if (!geneSubgroups.length) return []

    // agregar elementos que não sao genes
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