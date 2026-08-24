import React, { useState, useEffect } from "react";
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

export const Groups = () => {

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
    downloadJSON,
    availableElements,
  } = useGenerateGroups({ accessionsData, filters });

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

          {/* <button onClick={() => downloadJSON(groups, "groups.json")}>DOWNLOAD</button> */}

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

            <span>Accession: </span>
            <input
              type="text"
              value={SEARCH_NAME}
              onChange={({ target }) =>
                setSearchName(String(target.value))
            }
            />

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

            <div className={styles.filterInputs}>
              <div className={styles.filterInputContainer}>
                <span>Filtros de relacionamentos</span>
                <div className={styles.icons}>
                  <button
                    onClick={() => handleAddFilter("relation")}
                  >
                    <IoMdAddCircle />
                  </button>

                  <button
                    onClick={() => handleClearFilter("relation")}
                  >
                    <BsEraserFill />
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
                <span>Filtros de estruturas</span>
                <div className={styles.icons}>
                  <button
                    onClick={() => handleAddFilter("structure")}
                  >
                    <IoMdAddCircle />
                  </button>

                  <button
                    onClick={() => handleClearFilter("structure")}
                  >
                    <BsEraserFill />
                  </button>
                </div>

                <span>Elementos selecionados</span>
                {
                  elementsList.map(el => (
                    <span>{el}</span>
                  ))
                }
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
