import { getBacteriaData } from '../../services/graph'
import { useQuery } from '@tanstack/react-query'
/* import Plot from "react-plotly.js"; */

export const Sunburst = () => {
  
  const { data, isLoading } = useQuery({
    queryKey: ['getData'],
    queryFn: getBacteriaData
  })

  if (isLoading) return <div>Carregando...</div>;
  
  // Estrutura para evitar duplicatas
  const labels = ["Total"];  // Raiz principal
  const parents = [""];      // Raiz não tem pai
  const values = [0];        // Será calculado

  const organismos = new Set();
  const genesPorOrganismo = new Map();

  // Primeiro passada: coletar dados
  data?.forEach(item => {
    const Organismo = (item.Organismo || "Desconhecido").trim();
    const Gene = (item.Gene || "Sem gene").trim();
    const Count = Number(item.Count || 1);

    organismos.add(Organismo);
    
    if (!genesPorOrganismo.has(Organismo)) {
      genesPorOrganismo.set(Organismo, new Map());
    }
    
    const genesMap = genesPorOrganismo.get(Organismo);
    genesMap.set(Gene, (genesMap.get(Gene) || 0) + Count);
  });

  // Segunda passada: construir hierarquia
  organismos.forEach(organismo => {
    // Adicionar organismo como filho da raiz
    labels.push(organismo);
    parents.push("Total");
    values.push(0); // Valor será soma dos genes
    
    const genesMap = genesPorOrganismo.get(organismo);
    let totalOrganismo = 0;
    
    genesMap.forEach((count, gene) => {
      const geneLabel = `${gene}`;
      labels.push(geneLabel);
      parents.push(organismo);
      values.push(count);
      totalOrganismo += count;
    });
    
    // Atualizar valor do organismo com a soma dos genes
    const orgIndex = labels.indexOf(organismo);
    values[orgIndex] = totalOrganismo;
    
    // Atualizar valor da raiz
    values[0] += totalOrganismo;
  });

  console.log("labels", labels)
  console.log("parents", parents)
  console.log("values", values)

  return (
    <Plot
      data={[
        {
          type: "sunburst",
          labels: labels,
          parents: parents,
          values: values,
          branchvalues: "total", // ou "remainder"
          hoverinfo: "label+value+percent parent+percent root",
          textinfo: "label+value",
          insidetextorientation: "horizontal"
        }
      ]}
      layout={{
        font: {
          size: 30,
        }, 
        width: 1000,
        height: 1000,
        title: "Distribuição de Genes por Organismo"
      }}
    />
  );
}