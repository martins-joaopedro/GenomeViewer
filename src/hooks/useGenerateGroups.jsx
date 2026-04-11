import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getGroups } from "../services/group";
import { elements } from "chart.js";

export const useGenerateGroups = ({ accessionsData }) => {
  // params to filter the results

  console.log(accessionsData);

  const DEFAULT_MAX = 5000
  const DEFAULT_MIN = 2

  const [SEARCH_NAME, setSearchName] = useState("");
  const [MINIMAL_ELEMENTS, setMinimalElements] = useState(DEFAULT_MIN);
  const [willExpandRange, setExpandRange] = useState(false);
  const [wontEnterInOtherGroups, setEnterInOtherGroups] = useState(false);
  const [ELEMENTS_NEEDED, setElementsNeeded] = useState([]);
  const [MAXIMAL_DISTANCE, setMaximalDistance] = useState(DEFAULT_MAX);
  const [FIXED_GENOMES, setFixedGenome] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "getGroup",
      MINIMAL_ELEMENTS ?? DEFAULT_MIN,
      MAXIMAL_DISTANCE ?? DEFAULT_MAX,
      willExpandRange,
      wontEnterInOtherGroups,
      accessionsData
    ],
    queryFn: () =>
      getGroups({
        accessionsData,
        MINIMAL_ELEMENTS: MINIMAL_ELEMENTS ?? DEFAULT_MIN,
        MAXIMAL_DISTANCE: MAXIMAL_DISTANCE ?? DEFAULT_MAX,
        willExpandRange, 
        wontEnterInOtherGroups
      }),
  });

  const toggleElement = ({ value, checked }) => {
    let res = [];
    if (checked) 
        res = [...ELEMENTS_NEEDED, value];
    else res = ELEMENTS_NEEDED.filter((el) => el !== value);
    setElementsNeeded(res);
  };

  let neededSet = new Set(ELEMENTS_NEEDED);
      neededSet.add("gene")

  let filteredGroups = data?.data
  if(neededSet.size > 0 || SEARCH_NAME != "") {
      filteredGroups = data?.data.map(({ accession, groups }) => {
    
        // filter the valid groups
        const validGroups = groups.filter(group => {
            
            // categorias de elementos de um grupo
            const groupElementSet = new Set();  
            group.elementos.forEach(({ classification }) => {
              groupElementSet.add(classification)
            });
            
            const hasAllNeededElements = [...neededSet].every(element => groupElementSet.has(element))
            
            // filtra os grupos que tem mais que gene na composição
            groupElementSet.delete("gene")
            const hasMoreThanGenes = groupElementSet.size > 0

            return hasAllNeededElements && hasMoreThanGenes;
        });
        
        // returns the filtering by groups that contain all needed elements 
        return { 
            accession: accession,
            groups: validGroups
        };

        // removes non empty groups and filters by name
        }).filter(item => item.groups.length > 0 && item.accession.toLowerCase().includes(String(SEARCH_NAME).toLowerCase())) || [];
    }

  return {
    isLoading,
    groups: filteredGroups,
    foundElementsArray: Array.from(data?.foundElements || []),
    SEARCH_NAME,
    setSearchName,
    MINIMAL_ELEMENTS,
    setMinimalElements,
    willExpandRange,
    setExpandRange,
    wontEnterInOtherGroups,
    setEnterInOtherGroups,
    ELEMENTS_NEEDED,
    setElementsNeeded,
    MAXIMAL_DISTANCE,
    setMaximalDistance,
    toggleElement,
  };
};
