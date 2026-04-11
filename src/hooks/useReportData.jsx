import { useQuery } from "@tanstack/react-query"
import { getReportData } from "../services/report"

export const useReportData = ({ accession }) => {

    const { data } = useQuery({
        queryKey: ["getReportData", accession],
        queryFn: () => getReportData(accession)
    })

    return {
        report: data
    }
}