import { elements } from "chart.js";
import { get } from "./graph"
import { getIsolationClassification, getClassificationFile } from "./classifications";

const sorting = (el1, el2) => el1.contig.localeCompare(el2.contig) || el1.start - el2.start;


// TODO: sempre verificar a distancia máxima de um gene de outros MGES


export const getGroups = async ({ accessionsData, MINIMAL_ELEMENTS, MAXIMAL_DISTANCE }) => {
    
    const classificationFile = await getClassificationFile();
 
    //console.log(accessionsData);

    let allGroupsByAccession = []
    accessionsData.forEach(({ accession, args, integrons, phages, is_digis, is_isescan, isolation_source }) => {

        let elements = [...args, ...integrons, ...phages, ...is_digis ]
        let sortedElements = elements.sort(sorting)
        let elementsNumber = sortedElements.length
        let first = sortedElements[0]
        let contig = first.contig
        let current_group = [first]
        let group_end = first.stop
        let groups = []

        for (let i=1; i<elementsNumber; i++) {
            let node = sortedElements[i]

            //mudança de contig - finaliza grupo atual e reinicia 
            if (node.contig != contig) {
                if(current_group.length >= MINIMAL_ELEMENTS)
                    groups.push({contig, elementos: current_group})
                contig = node.contig
                current_group = [node]
                group_end = node.stop
            }
            else {
                //mesmo contig, se tiver na proximidade definida, agrupa
                    if (Math.abs(node.start - group_end) <= MAXIMAL_DISTANCE) {
                        current_group.push(node)
                        group_end = Math.max(group_end, node.stop)
                    } 
                    else {
                        //finaliza o grupo atual
                            if(current_group.length >= MINIMAL_ELEMENTS)
                                groups.push({contig, elementos: current_group})
                        //NOVO grupo no MESMO contig
                            current_group = [node]
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

    // removes empties accessions groups
    let result = allGroupsByAccession.filter(({ accession, groups }) => groups.length) || []

    // get all elements tags
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

// pra cada grupo verificar o raio dos genes e eliminar elementos que não estão nesses raios
/* const checkGroupInRatio = (group) => {
    
    let genesGrouping = []

    let allElementsTag = new Set()
    group.forEach(({ elementos }) => elementos.forEach(element => {
        allElementsTag.add(element.classification)
        
        const MAXIMAL_DISTANCE = 5000;

        // crio os subgrupos de cada gene
        if(element.classification == "gene") {
            
            const minRange = Math.max(0, element.start - MAXIMAL_DISTANCE)
            const maxRange = element.stop + MAXIMAL_DISTANCE 

            // grupos estão ordenados em contig e ordem crescente de posição
            const isTheSameContig = genesGrouping.at(-1) && genesGrouping.at(-1)?.contig == element.contig 
            const isAtTheRange = genesGrouping.at(-1) && (element.stop - genesGrouping.at(-1).maxRange < 5000)

            // genes que estão no mesmo raio são parte do mesmo grupo
            if(genesGrouping.length > 0 && isTheSameContig && isAtTheRange) {
                genesGrouping.at(-1).elementos.push(element)
            } else { // caso não formam outro grupo
                genesGrouping.push({
                    contig: element.contig,
                    elementos: [element],
                    minRange,
                    maxRange,
                })
            }
        }
    }))

    // conecto os elementos nos seus devidos grupos 
    let groupIndex = 0;
    group
        .forEach(({ elementos }) => {
            
            elementos.filter(({ classification }) => classification != "gene")

            .forEach(({ elementos }) => elementos.forEach(({ start, stop }) => {

            })) 

        })       


    console.log("all groups", genesGrouping)
    console.log("all group tags: ", allElementsTag)

    const hasGenes = allElementsTag.has("gene")

    return group && hasGenes
} */

const checkGroupInRatio = ({ contig, elementos }) => {
    
    const MAXIMAL_DISTANCE = 5000;
    let geneSubgroups = []

        // cria subgrupos de genes
        elementos.forEach(element => {

            if (element.classification !== "gene") return

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

                // manipular isso via interface
                // mudar nomes pra complexo e subgrupos extritos
                // modificar controles ali 
                
                if (isInside) {
                    group.elementos.push(element)
                }
            }
        })

        // validar subgrupos: devem ter gene + pelo menos outro elemento
        geneSubgroups = geneSubgroups.filter(group => {
            const hasGene = group.elementos.some(el => el.classification === "gene")
            const hasOther = group.elementos.some(el => el.classification !== "gene")
            return hasGene && hasOther
        })

        // 🔹 3. retorno: agora são SUBGRUPOS reais
        return geneSubgroups.map(sub => ({
            contig: sub.contig,
            elementos: sub.elementos
        }))
}