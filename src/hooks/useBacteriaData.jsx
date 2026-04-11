import { useQuery } from "@tanstack/react-query"
import { getBacteriaData } from "../services/graph"

export const useBacteriaData = ({ accession, gene }) => {
  
    const { data: bacteria } = useQuery({
        queryKey: ["getBacteriaData", accession, gene],
        queryFn: getBacteriaData
    })

    let result = bacteria?.filter(el => el.Accession == accession && el.Gene == gene)[0] || {}
    let string = `Mechanism: ${result["Resistance Mechanism"]}   Drug: ${result["Drug Class"]}` || ""
    return {
        geneInfo: string
    }
}
