import { get } from "./graph";

export const getReportData = async (accession) => {
    try {

        const res = await fetch(`https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/${accession}/dataset_report`);
        const { reports } = await res.json()
        return reports?.at(0) || {}

    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        return [];
    }
}

