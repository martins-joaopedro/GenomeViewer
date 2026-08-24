import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getGroups } from "../services/group";
import { getData } from "../services/localStorage";
import { Groups } from "../screens/Groups";
import { elements } from "chart.js";
import { MdElectricBike } from "react-icons/md";

export const useGenerateGroups = ({ accessionsData, filters }) => {

  // params to filter the results
  const DEFAULT_MAX = 1000
  const DEFAULT_MIN = 0

  const allClassifications = ["clinical", "environmental", "veterinary", "food", "other"]
  const state = getData("state");

  const [SEARCH_NAME, setSearchName] = useState(state?.SEARCH_NAME || "");
  const [MINIMAL_ELEMENTS, setMinimalElements] = useState(state?.MINIMAL_ELEMENTS || DEFAULT_MIN);
  const [ELEMENTS_NEEDED, setElementsNeeded] = useState(state?.ELEMENTS_NEEDED || []);
  const [CLASSIFICATIONS, setClassifications] = useState(state?.CLASSIFICATIONS || []);
  const [MAXIMAL_DISTANCE, setMaximalDistance] = useState(state?.MAXIMAL_DISTANCE || DEFAULT_MAX);
  const [FIXED_GENOMES, setFixedGenome] = useState([]);
  const [INDEX, setIndex] = useState(state?.INDEX || 0);

  const { data, isLoading } = useQuery({
    queryKey: [
      "getGroup",
      MINIMAL_ELEMENTS ?? DEFAULT_MIN,
      MAXIMAL_DISTANCE ?? DEFAULT_MAX,
      accessionsData
    ],
    queryFn: () =>
      getGroups({
        accessionsData,
        MINIMAL_ELEMENTS: MINIMAL_ELEMENTS ?? DEFAULT_MIN,
        MAXIMAL_DISTANCE: MAXIMAL_DISTANCE ?? DEFAULT_MAX,
      }),
  });

  function downloadJSON(data, filename = "dados.json") {
    const json = JSON.stringify(data, null, 2); // indentação de 2 espaços

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  const toggleElement = ({ value, checked }) => {
    let res = [];
    if (checked)
      res = [...ELEMENTS_NEEDED, value];
    else res = ELEMENTS_NEEDED.filter((el) => el !== value);
    setElementsNeeded(res);
  };

  const toggleClassification = ({ value, checked }) => {
    let res = [];
    if (checked)
      res = [...CLASSIFICATIONS, value];
    else res = CLASSIFICATIONS.filter((el) => el !== value);
    setClassifications(res);
  };


  // filtros
  let filteredGroups = data?.data || [];
  //console.log(filteredGroups.length)



  // filtro de nome do arquivo
  if (SEARCH_NAME !== "") {
    const searchName = String(SEARCH_NAME).toLowerCase();
    let filteredGroupsByName = filteredGroups.filter(
      ({ accession }) =>
        accession
          .toLowerCase()
          .includes(searchName)
        );

    filteredGroups = filteredGroupsByName
    //console.log(filteredGroups.length)
  }



  // filtro de classificação de recurso de isolamento
  if (CLASSIFICATIONS.length > 0) {
    let filteredGroupsByClassification = filteredGroups.filter(
      ({ isolationClassification }) =>
        CLASSIFICATIONS.includes(isolationClassification)
    );
    filteredGroups = filteredGroupsByClassification
    //console.log(filteredGroups.length)
  }



  // filtro de categorias de elementos necessários
  let neededSet = new Set(ELEMENTS_NEEDED);
  neededSet.add("gene")

  if (neededSet.size > 1) {

    let filteredGroupsByElementsNedeed = filteredGroups
      .map(genome => {

        const groups = genome.groups
          .map(group => {

            // retorna os subgrupos que tem todos os elementos necessários
            const subgroups = group.subgroups.filter(
              subgroup => {

                const subgroupElementSet = new Set(subgroup.elementos.map(({ classification }) => classification));

                return [...neededSet].every(
                  element =>
                    subgroupElementSet.has(element)
                );
              }
            );

            // mantém o group somente se
            // tiver pelo menos um subgrupo válido
            return subgroups.length > 0
              ? {
                ...group,
                subgroups
              }
              : null;
          })
          .filter(Boolean);

        // mantém o genoma somente se
        // tiver pelo menos um group válido
        return groups.length > 0
          ? {
            ...genome,
            groups
          }
          : null;
      })
      .filter(Boolean);

    filteredGroups = filteredGroupsByElementsNedeed
    //console.log(filteredGroups.length)
  }



  // filtros de relação e estrutura
  filters = filters.filter(({ active }) => active)

  if (filters.length > 0) {

    let filteredGroupsByRelations = filteredGroups.map(genome => {
      const groups = genome.groups.map(group => {

        // filtro os subgrupos se eles respeitarem todos os filtros ativos
        const subgroups = group.subgroups.filter(subgroup => {

          const elementos = subgroup.elementos
          const names = new Set(elementos.map(e => e.name))

          return filters.every(filter => {

            const { type } = filter

            // filtro de estrutura => contém todos os elementos passados 
            // e é um potencial grupo que tem a estrutura
            if (type === "structure") {
              const { elements } = filter
              return elements.every(elemento => names.has(elemento))
            }

            // filtro de relação => critérios de distancia
            if (type === "relation") {

              const { from, to, maxDistance } = filter

              if (!names.has(from) || !names.has(to))
                return false

              for (let i = 0; i < elementos.length; i++) {
                for (let j = i + 1; j < elementos.length; j++) {

                  const e1 = elementos[i];
                  const e2 = elementos[j];

                  // verifica se é o par procurado
                  if (!((e1.name === from && e2.name === to) || (e1.name === to && e2.name === from)))
                    continue;

                  let maior = e1
                  let menor = e2

                  let lenE2 = (e2.stop - e2.start)
                  let lenE1 = (e1.stop - e1.start)

                  if (lenE2 > lenE1) {
                    maior = e2
                    menor = e1
                  }

                  const inside = menor.start >= maior.start && menor.stop <= maior.stop

                  const distance = Math.min(
                    Math.abs(e1.stop - e2.start),
                    Math.abs(e2.stop - e1.start)
                  )

                  // se um elemento tá contido dentro do outro ou respeita o critério de distancia 
                  if (inside || distance <= maxDistance)
                    return true
                }
              }

              // falso para caso não seja válido em nenhum filtro de relação
              return false
            }

            // retorna falso pra caso nao respeite nenhum dos critérios de filtros
            return false
          })
        })

        return subgroups?.length > 0
          ? { ...group, subgroups }
          : null

      }).filter(Boolean)

      return groups?.length > 0
        ? { ...genome, groups }
        : null

    }).filter(Boolean)
    filteredGroups = filteredGroupsByRelations
    //console.log(filteredGroups.length)
  }



  let availableElements = new Set()

  filteredGroups.forEach(({ groups }) => {
    groups.forEach(({ subgroups }) => {
      subgroups.forEach(({ elementos }) => {
        elementos.forEach(({ name }) => availableElements.add(name))
      })
    })
  })

  return {
    isLoading,
    groups: filteredGroups,
    foundElementsArray: Array.from(data?.foundElements || []),
    SEARCH_NAME,
    setSearchName,
    MINIMAL_ELEMENTS,
    setMinimalElements,
    CLASSIFICATIONS,
    allClassifications,
    setClassifications,
    ELEMENTS_NEEDED,
    setElementsNeeded,
    MAXIMAL_DISTANCE,
    setMaximalDistance,
    toggleElement,
    toggleClassification,
    INDEX,
    setIndex,
    downloadJSON,
    availableElements: Array.from(availableElements || [])
  };
};
