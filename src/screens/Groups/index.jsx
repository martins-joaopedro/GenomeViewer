import React, { useState, useEffect } from "react";
import { useGenerateGroups } from "../../hooks/useGenerateGroups";
import { Plot } from "../../components/Plot";
import styles from "./styles.module.css";
import { useReportData } from "../../hooks/useReportData";
import { Report } from "../../components/Report";

export const Groups = () => {

  const [accessionsData, setData] = useState()
  const [index, setIndex] = useState(0);
  const [flattened, setFlattened] = useState(false);

  const inc = () => setIndex((prev) => prev + 1);
  const dec = () => setIndex((prev) => prev - 1);
  const toggleFlattened = () => setFlattened((prev) => !prev);

  const handleFileInput = async ({ target }) => {
      const file = target.files[0];
      if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const parsedData = await JSON.parse(e.target.result);
            console.log(parsedData);
            setData(parsedData)
            
          } catch (error) {
            alert("Erro ao processar arquivo: " + error.message);
          }
        };
        reader.readAsText(file);
      } else {
        alert("Arquivo inválido");
      }   
  }

  const {
    groups,
    foundElementsArray,
    SEARCH_NAME,
    MAXIMAL_DISTANCE,
    MINIMAL_ELEMENTS,
    ELEMENTS_NEEDED,
    setMaximalDistance,
    setMinimalElements,
    setSearchName,
    toggleElement,
    willExpandRange,
    setExpandRange,
    wontEnterInOtherGroups,
    setEnterInOtherGroups,
  } = useGenerateGroups({ accessionsData });

  const { report } = useReportData({
    accession: groups && groups[index]?.accession,
  });

  // fixes groups index
  // outra solução indexar pelo nmr do grupo e aplicar o maximo se for maior
  useEffect(() => {
    if (groups && groups[index] === undefined) {
      setIndex(0);
    }

    const handleKeyDown = ({ key }) => {
      switch (key) {
        case "ArrowRight":
          inc();
          break;
        case "ArrowLeft":
          dec();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [groups, index]);

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.metricsContainer}>
          <div className={styles.metrics}>
            <div className={styles.controls}>
              <div className={styles.checkboxes}>
                {foundElementsArray &&
                  foundElementsArray?.map((category, index) => (
                    <label key={index}>
                      <input
                        type="checkbox"
/* 
                        TODO: marcando sozinho */

                        checked={ELEMENTS_NEEDED.find(el => el == category)}
                        value={category}
                        onChange={({ target }) => toggleElement(target)}
                      />
                      {category}
                    </label>
                  ))}
              </div>
            </div>

            <span>Envie o arquivo</span>
            <input type="file" accept=".json" onChange={handleFileInput} />

            <span>Pesquise o nome do arquivo: </span>
            <input
              type="text"
              value={SEARCH_NAME}
              onChange={({ target }) =>
                setSearchName(String(target.value))
              }
            />

            <button onClick={() => setExpandRange(prev => !prev)}> 
              <span>{willExpandRange ? "VAI EXPANDIR" : "NAO VAI EXPANDIR"}</span>
            </button>

            <button onClick={() => setEnterInOtherGroups(prev => !prev)}> 
              <span>{wontEnterInOtherGroups ? "NAO VAI ENTRAR EM OUTROS" : "VAI ENTRAR"}</span>
            </button>

            <span>Defina a Distância Máxima: </span>
            <input
              type="number"
              value={MAXIMAL_DISTANCE}
              onChange={({ target }) =>
                setMaximalDistance(Number(target.value))
              }
            />

            <span>Defina o Mínimo de Elementos: </span>
            <input
              type="number"
              value={MINIMAL_ELEMENTS}
              onChange={({ target }) =>
                setMinimalElements(Number(target.value))
              }
            />
            <button onClick={toggleFlattened}>Achatar</button>
            
            <div className={styles.accessionControls}>
              <button onClick={dec} disabled={index === 0}>
                Anterior
              </button>
              <button onClick={inc} disabled={index === groups?.length - 1}>
                Próximo
              </button>
            </div>
          </div>
          <div className={styles.results}>
            <span>Accession: {groups && groups[index]?.accession}</span>
            <span>{`Grupos encontrados em ${groups?.length} genomas!`}</span>
          </div>
          <Report report={report} />
        </div>
        { groups?.length ? (
          <div className={styles.chart}>
            <Plot
              groups={groups[index]}
              index={index}
              flattened={flattened}
              width={"100%"}
              height={500}
              fontSize={10}
            />
          </div>
        ) : (
          <div className={styles.error}>
            <span>:'(</span>
            <span>Nenhum grupo encontrado com essas configurações!</span>
          </div>
        )}
      </div>
    </div>
  );
};
