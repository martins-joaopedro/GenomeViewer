import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import styles from "./styles.module.css";
import { useBacteriaData } from "../../hooks/useBacteriaData";
import { useState } from "react";
import { useFilters } from "../../hooks/useFilters";

import { IoIosInformationCircle } from "react-icons/io";

ChartJS.register(
  CategoryScale,
  ChartDataLabels,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Plot = ({ groups, index, flattened, width, height, fontSize, elements, filteredElements, onToggleElement }) => {
  const classification = {
    gene: {
      color: "#fca78e",
      label: "ARG",
    },
    integrons: {
      color: "#4BCFCF",
      label: "Integron",
    },
    phage: {
      color: "#0F68DD",
      label: "Phage",
    },
    transposable_phage: {
      color: "#B456EB",
      label: "Transposable Phage",
    },
    is_isescan: {
      color: "#141414",
      label: "Is",
    },
    is_digis: {
      color: "#fccc66",
      label: "Is_1",
    },
  };

  const [gene, setGene] = useState("")
  const { geneInfo } = useBacteriaData({ accession: (groups && groups?.accession), gene })

  const allLabels = Object.values(classification).map((d) => d.label);

  const buildChart = (elementos, title, key, isSubGroup = false) => {
    if (!elementos || elementos.length === 0) return null;

    const sortedElementos = elementos.sort((a, b) => a.start - b.start);
    const min = sortedElementos[0]?.start;
    let max = -Infinity
    sortedElementos.forEach(el => { max = Math.max(max, el.stop) })

    return {
      contigName: title,
      contigIndex: key,
      isSubGroup,
      chartData: {
        labels: allLabels,
        datasets: [
          {
            label: "Elementos Genéticos",
            data: elementos.map((d, i) => ({
              x: [d.start, d.stop],
              y: flattened ? "Elementos" : i,
              elementLabel: d.name,
              classification: d.classification,
            })),
            borderRadius: {
              topLeft: 10,
              topRight: 10,
              bottomLeft: 10,
              bottomRight: 10
            },
            borderSkipped: false,
            backgroundColor: elementos.map((d) => {
              const color =
                  (classification[d.classification]?.color || "gray") +
                  (flattened ? "80" : "");

              if (filteredElements.size > 0) {
                  return filteredElements.has(d.name)
                      ? color
                      : "rgba(0, 0, 0, 0.28)";
              }

              return color;
            }),
            barThickness: Math.min(10, height / (elementos.length + 20)),
            borderColor: ctx => {
              const raw = ctx.raw

              if(elements.has(raw.elementLabel))
                return "#000"
              else if (filteredElements.has(raw.elementLabel))
                return "#070707"
            },
            borderWidth: ctx => {
                const raw = ctx.raw;

                return elements.has(raw.elementLabel) || filteredElements.has(raw.elementLabel)
                    ? 2
                    : 0;
            },
          },
        ],
      },
      options: {
        onClick: (event, elements, chart) => {
          if (!elements.length) return;

          const { datasetIndex, index } = elements[0];
          const data = chart.data.datasets[datasetIndex].data[index];
          const { elementLabel } = data
          
          // dispara o evento de adição de elemento
          onToggleElement(elementLabel)
        },
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "Posição" },
            min,
            max,
          },
          y: {
            type: "category",
            title: { display: true, text: "Elementos" },
            labels: flattened
              ? ["Elementos"]
              : elementos.map((_, i) => i),
            ticks: {
              display: !flattened, 
            },
            grid: {
              display: false,
            },
            reverse: true,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ({ raw }) => {
                const { elementLabel, classification } = raw || {};
                const positions = `Start: ${raw.x[0]} | Stop: ${raw.x[1]} | `

                if (classification === "gene") {
                  setGene(elementLabel);
                  return positions + geneInfo || "";
                }

                return positions + classification;
              },
              title: (context) => {
                const { raw } = context[0] || {};
                return raw?.elementLabel || "";
              },
            },
          },
          datalabels: {
            font: {
              size: Math.max(10, fontSize - (elementos.length / fontSize)),
            },
            formatter: (value, context) =>
              !flattened
                ? context.dataset.data[context.dataIndex].elementLabel
                : "",
            textAlign: "center",
            color: "#000000e0",
          },
        },
      },
    };
  };

  const generateAllCharts = (groups) => {
    if (!groups) return [];

    return groups.flatMap(({ contig, elementos, subgroups }, contigIndex) => {

      const data = {}

      const groupChart = buildChart(
        elementos,
        `${contig} (Grupo)`,
        `${contigIndex}-group`
      );

      data.mainChart = groupChart;
      data.subCharts = []

      if (subgroups?.length) {
        subgroups.forEach((sg, sgIndex) => {
          const subChart = buildChart(
            sg.elementos,
            `${contig} - Subgrupo ${sgIndex + 1}`,
            `${contigIndex}-sub-${sgIndex}`,
            true // é um subgrupo
          );
          data.subCharts.push(subChart)
        });
      }

      return data;
    });
  };

  const allCharts = generateAllCharts(groups?.groups);

  return (
    <div className={styles.chartsList} data-classification={groups?.classification} >
      {groups &&
        allCharts?.map((group, i) => (
          <div className={styles.chartContainer} key={i}>
            <span className={styles.isolationLabel}>{groups?.isolationSource}</span>
            <div
              className={styles.chart}
              style={{
                width: `100%`,
                maxHeight: `${!flattened ? height : 300}px`,
              }}
            >
              <div className={styles.icon}>
                <IoIosInformationCircle />
              </div>
              <h4>{group.mainChart.contigName}</h4>
              <Bar data={group.mainChart.chartData} options={group.mainChart.options} />
            </div>

            <div className={styles.subChartContainer}>
              
              {group.subCharts &&
                group.subCharts?.map(({ contigIndex, contigName, chartData, options, isSubGroup }) =>
                (<div
                  className={isSubGroup ? styles.subChart : styles.chart}
                  key={contigIndex}
                  style={{
                    width: `100%`,
                    maxHeight: `${!flattened ? (height - 100) : 300}px`,
                  }}
                > 
                  <div className={styles.icon}>
                    <IoIosInformationCircle/>
                  </div>
                  <h4>{contigName}</h4>
                  <Bar data={chartData} options={options} />
                </div>))
              }
            </div>
          </div>
        ))}
    </div>
  );


};
