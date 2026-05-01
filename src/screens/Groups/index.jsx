import React, { useState, useEffect } from "react";
import { useGenerateGroups } from "../../hooks/useGenerateGroups";
import { Plot } from "../../components/Plot";
import styles from "./styles.module.css";
import { useReportData } from "../../hooks/useReportData";
import { Report } from "../../components/Report";
import { getData, saveData } from "../../services/localStorage";

export const Groups = () => {

  const [accessionsData, setData] = useState()
  
  const [height, setHeight] = useState(3);
  const [flattened, setFlattened] = useState(false);

  const toggleFlattened = () => setFlattened((prev) => !prev);

  const handleFileInput = async ({ target }) => {
      const file = target.files[0];
      if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const parsedData = await JSON.parse(e.target.result);
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
    allClassifications,
    CLASSIFICATIONS,
    setClassifications,
    setMaximalDistance,
    setMinimalElements,
    setSearchName,
    toggleElement,
    toggleClassification,
    INDEX, 
    setIndex,
  } = useGenerateGroups({ accessionsData });

  const inc = () => {
    setIndex((prev) => prev + 1);
  }
  
  const dec = () => {
    setIndex((prev) => prev - 1);
  }

  useEffect(() => {
  if (!groups?.length) return;

  setIndex((prev) => {
      if (prev >= groups.length) {
        return groups.length - 1;
      }
      if (prev < 0) {
        return 0;
      }
      return prev;
    });
  }, [groups]);

  const { report } = useReportData({
    accession: groups && groups[INDEX]?.accession,
  });

  useEffect(() => {
    const handleKeyDown = ({ key }) => {
      if (key === "ArrowRight") inc();
      if (key === "ArrowLeft") dec();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    saveData("state", {
      INDEX,
      SEARCH_NAME,
      MAXIMAL_DISTANCE,
      MINIMAL_ELEMENTS,
      ELEMENTS_NEEDED,
      CLASSIFICATIONS
    });
  }, [SEARCH_NAME, MAXIMAL_DISTANCE, MINIMAL_ELEMENTS, ELEMENTS_NEEDED, CLASSIFICATIONS, INDEX]);

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.metricsContainer}>

          <div className={styles.results}>
            <span>Accession: {groups && groups[INDEX]?.accession}</span>
            <span>{`Foram encontrados agrupamentos com essas configurações em ${groups?.length} genomas!`}</span>
            <span>indice: {INDEX} / {groups.length}</span>
          
          </div>

          <div className={styles.metrics}>
            
            <label className={styles.fileLabel} htmlFor="arquivo">Enviar arquivo</label>
            <input  
              name="arquivo" id="arquivo"
              type="file" accept=".json" 
              onChange={handleFileInput} 
            />
            
            <div className={styles.cell}>
              <span>Elementos necessários no grupo</span>
              <div className={styles.controls}>
                <div className={styles.checkboxes}>
                  {foundElementsArray &&
                    foundElementsArray?.map((category, index) => (
                      <label key={index}>
                        <input
                          type="checkbox"
                          checked={ELEMENTS_NEEDED.find(el => el == category)}
                          value={category}
                          onChange={({ target }) => toggleElement(target)}
                        />
                        {category}
                      </label>
                    ))}
                </div>
              </div>

              <span>Classificações</span>
              <div className={styles.controls}>
                <div className={styles.checkboxes}>
                  {allClassifications &&
                    allClassifications?.map((category, index) => (
                      <label key={index}>
                        <input
                          type="checkbox"
                          checked={CLASSIFICATIONS.find(el => el == category)}
                          value={category}
                          onChange={({ target }) => toggleClassification(target)}
                        />
                        {category}
                      </label>
                    ))}
                </div>
              </div>
            </div>
            
            <span>Pesquise o nome do arquivo: </span>
            <input
              type="text"
              value={SEARCH_NAME}
              onChange={({ target }) =>
                setSearchName(String(target.value))
              }
            />

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
            
            <span>Defina a Altura dos Gráficos: </span>
            <input
              type="range"
              min={3}
              max={8}
              value={height}
              onChange={({ target }) =>
                setHeight(Number(target.value))
              }
            />
            <button onClick={toggleFlattened}>Achatar</button>
            
            <div className={styles.accessionControls}>
              <button onClick={dec} disabled={INDEX === 0}>
                Anterior
              </button>
              <button onClick={inc} disabled={INDEX === groups?.length - 1}>
                Próximo
              </button>
            </div>
          </div>
          
          <Report report={report} isolationSource={groups[INDEX]?.isolationSource} />
        </div>
        { groups?.length ? (
          <div className={styles.chart}>
            <Plot
              groups={groups[INDEX]}
              index={INDEX}
              flattened={flattened}
              width={"100%"}
              height={height * 100}
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
