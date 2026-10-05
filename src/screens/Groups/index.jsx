import React, { useState, useEffect, useRef } from "react";
import { useGenerateGroups } from "../../hooks/useGenerateGroups";
import { Plot } from "../../components/Plot";
import styles from "./styles.module.css";
import { useReportData } from "../../hooks/useReportData";
import { Report } from "../../components/Report";
import { getData, saveData } from "../../services/localStorage";
import { useFilters } from "../../hooks/useFilters";
import { FilterCard } from "../../components/FilterCard";

import { BsEraserFill } from "react-icons/bs";
import { IoMdAddCircle } from "react-icons/io";
import { IoMdClose } from "react-icons/io";
import { RiDeleteBack2Fill } from "react-icons/ri";


import { MetricsReport } from "../../components/MetricsReport";

export const Groups = ({ handleOpenModal }) => {

  const inputRef = useRef()
  const [accessionsData, setData] = useState()

  const [height, setHeight] = useState(4);
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
    elements,
    elementsList,
    handleToggleElement,
    handleAddElement,
    handleRemoveElement,
    filters,
    filteredElements,
    handleAddFilter,
    handleToggleFilter,
    handleRemoveFilter,
    handleClearFilter,
    filter,
    setFilter,
  } = useFilters()

  const {
    groups,
    foundElementsArray,
    SEARCH_NAME,
    SEARCH_LOCATION,
    SEARCH_ISOLATION,
    MAXIMAL_DISTANCE,
    MINIMAL_ELEMENTS,
    ELEMENTS_NEEDED,
    allClassifications,
    CLASSIFICATIONS,
    setClassifications,
    setMaximalDistance,
    setMinimalElements,
    setSearchName,
    setSearchLocationName,
    setSearchIsolationName,
    toggleElement,
    toggleClassification,
    INDEX,
    setIndex,
    downloadJSON,
    availableElements,
    metrics,
  } = useGenerateGroups({ accessionsData, filters });

  const inc = () => {
    setIndex((prev) => prev + 1);
  }

  const dec = () => {
    setIndex((prev) => prev - 1);
  }

  const handleFixGenome = (accession) => {
    setSearchName(accession)
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
      SEARCH_LOCATION,
      SEARCH_ISOLATION,
      MAXIMAL_DISTANCE,
      MINIMAL_ELEMENTS,
      ELEMENTS_NEEDED,
      CLASSIFICATIONS
    });
  }, [SEARCH_NAME, SEARCH_LOCATION, SEARCH_ISOLATION, MAXIMAL_DISTANCE, MINIMAL_ELEMENTS, ELEMENTS_NEEDED, CLASSIFICATIONS, INDEX]);

  return (
    <div>
      <div className={styles.horizontalContainer}>
        <MetricsReport 
          index={INDEX}
          totalGroups={groups?.length}
          accession={groups[INDEX]?.accession}
          metrics={metrics} 
          fixed={groups[INDEX]?.accession == SEARCH_NAME}
          onFixGenome={handleFixGenome}
        >
          <div className={styles.accessionControls}>
            <button onClick={dec} disabled={INDEX === 0}>
              Anterior
            </button>
            <button onClick={inc} disabled={INDEX === groups?.length - 1}>
              Próximo
            </button>
          </div>

          <label className={styles.fileLabel} htmlFor="arquivo">Enviar arquivo</label>
          <input
            name="arquivo" id="arquivo"
            type="file" accept=".json"
            onChange={handleFileInput}
          />

          <button onClick={() => handleOpenModal()}>
            check me!
          </button>  
        
        </MetricsReport>
      </div>

      <div className={styles.container}>
        <div className={styles.metricsContainer}>
          <div className={styles.metrics}>

            <div className={styles.filterInputContainer}>
              <span>Recurso de isolamento: </span>
              <div className={styles.inputControlsContainer}>
                <input
                  type="text"
                  value={SEARCH_ISOLATION}
                  onChange={({ target }) =>
                    setSearchIsolationName(String(target.value))
                }
                />
                <button onClick={() => setSearchIsolationName("")}>
                  <RiDeleteBack2Fill color="var(--icons)" />
                </button>
              </div>

              <span>Accession: </span>
              <div className={styles.inputControlsContainer}>
                <input
                  type="text"
                  value={SEARCH_NAME}
                  onChange={({ target }) =>
                    setSearchName(String(target.value))
                }
                />
                <button onClick={() => setSearchName("")}>
                  <RiDeleteBack2Fill color="var(--icons)" />
                </button>
              </div>

              <span>Localização: </span>
              <div className={styles.inputControlsContainer}>
                <input
                  type="text"
                  value={SEARCH_LOCATION}
                  onChange={({ target }) =>
                    setSearchLocationName(String(target.value))
                }
                />
                <button onClick={() => setSearchLocationName("")}>
                  <RiDeleteBack2Fill color="var(--icons)" />
                </button>
              </div>
            </div>

            <div className={styles.sliders}>
              <span>Altura dos gráficos: {height * 100}</span>
              <input
                type="range"
                min={4}
                max={9}
                value={height}
                onChange={({ target }) =>
                  setHeight(Number(target.value))
                }
              />

              <span>Distância máxima: { MAXIMAL_DISTANCE } </span>
              <input
                type="range"
                min={0}
                max={10}
                value={MAXIMAL_DISTANCE / 1000}
                onChange={({ target }) =>
                  setMaximalDistance(Number(target.value) * 1000)
                }
              />
            </div>

            <div className={styles.filterInputs}>
              <h3>Filtros:</h3>

              <div className={styles.filterInputContainer}>
                <span>Relacionamentos</span>
                <div className={styles.icons}>
                  <button
                    onClick={() => handleAddFilter("relation")}
                  >
                    <IoMdAddCircle color="var(--icons)" />
                  </button>

                  <button
                    onClick={() => handleClearFilter("relation")}
                  >
                    <BsEraserFill color="var(--icons)" />
                  </button>
                </div>

                <span>Nome: </span>
                <input
                  placeholder={"Dê um nome ao filtro"}
                  onChange={({ target }) => setFilter("name", target.value)}
                  value={filter?.name || ""}
                />

                <input
                  list="elementos"
                  value={filter?.from || ""}
                  placeholder="Primeiro elemento"
                  onChange={({ target }) => setFilter("from", target.value)}
                />

                <input
                  list="elementos"
                  value={filter?.to || ""}
                  placeholder="Segundo elemento"
                  onChange={({ target }) => setFilter("to", target.value)}
                />

                <datalist id="elementos">
                  {availableElements.map(opcao => (
                    <option key={opcao} value={opcao} />
                  ))}
                </datalist>

                <span>Distância: </span>
                <input
                  onChange={({ target }) => setFilter("maxDistance", Number(target.value))}
                  placeholder={"Informe a distância máxima"}
                  value={filter?.maxDistance || ""}
                />
              </div>

              <div className={styles.filterInputContainer}>

                <span>Estruturas</span>
                <div className={styles.inputControlsContainer}>
                  <input
                    ref={inputRef}
                    list="elementos"
                    placeholder="Elemento"
                  />
              
                  <button
                    onClick={() => handleAddElement(inputRef)}
                  >
                    <IoMdAddCircle color="var(--icons)" />
                  </button>
                  
                </div>

                <div className={styles.icons}>
                  <button
                    onClick={() => handleAddFilter("structure")}
                  >
                    <IoMdAddCircle color="var(--icons)" />
                  </button>

                  <button
                    onClick={() => handleClearFilter("structure")}
                  >
                    <BsEraserFill color="var(--icons)" />
                  </button>
                </div>

                <div className={styles.selectedElements}>
                  <span>Elementos selecionados</span>
                  {
                    elementsList.map(el => (
                      <div key={el} className={styles.elementsPill}>
                        <span>{el}</span>
                        <button onClick={() => handleRemoveElement(el)}>
                          <IoMdClose />
                        </button>
                      </div>
                    ))
                  }
                </div>
                </div>

              <div className={styles.filtersContainer}>
                {
                  !!filters && filters.map(({ type, name, from, to, maxDistance, active, elements }, index) => (
                    <FilterCard
                      key={index}
                      type={type}
                      index={index}
                      name={name}
                      from={from}
                      to={to}
                      elements={elements}
                      maxDistance={maxDistance}
                      active={active}
                      onToggleFilter={handleToggleFilter}
                      onRemoveFilter={handleRemoveFilter}
                    />
                  ))
                }
              </div>
            </div>

            <div className={styles.filterInputContainer}>
              <div className={styles.controls}>
              <h4>Elementos no grupo</h4>
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

              <div className={styles.controls}>
                <h4>Classificações</h4>
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

            {/* 
              <span>Mínimo de elementos: </span>
              <input
                type="number"
                value={MINIMAL_ELEMENTS}
                onChange={({ target }) =>
                  setMinimalElements(Number(target.value))
                }
              /> */}

            <button onClick={toggleFlattened}>Achatar</button>

            
          </div>

          <Report report={report} isolationSource={groups[INDEX]?.isolationSource} />
        </div>

        {groups?.length ? (
          <div className={styles.chart}>
            <Plot
              groups={groups[INDEX]}
              index={INDEX}
              flattened={flattened}
              width={"100%"}
              height={height * 100}
              fontSize={10}
              elements={elements}
              filteredElements={filteredElements}
              onToggleElement={handleToggleElement}
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
