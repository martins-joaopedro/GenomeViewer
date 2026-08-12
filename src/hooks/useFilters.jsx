
import { useEffect, useState } from "react"
import { getData, saveData } from "../services/localStorage"


export const useFilters = () => {

    const state = getData("filters")

    const [elements, setElements] = useState(new Set())
    const [filter, setFilterState] = useState({})
    const [filters, setFilters] = useState(state?.filters || [])

    const handleToggleElement = (label) => {
        // toggle dos elementos clicados
        setElements(prev => {

            const next = new Set(prev);

            if (next.has(label))
                next.delete(label);
            else 
                next.add(label);

            return next;
        });
    }

    const handleRemoveFilter = (index) => {
        console.log(index);
        setFilters(prev =>
            prev.filter((_, i) => i !== index)
        );
    }

    const addRelationFilter = () => {
        const { name, from, to, maxDistance } = filter 

        if (!from || !to || maxDistance === "") {
            alert("Preencha todos os campos!");
            return;
        }

        setFilters(prev => {
            
            const exists = prev.some(f =>
                f.from === from &&
                f.to === to &&
                f.maxDistance === maxDistance
            );

            if (exists) {
                alert("Já existe esse filtro!");
                return prev;
            }
            
            return [...prev, { type: "relation", name, from, to, maxDistance, elements: Array.from(elements), active: true }];
        });
    }
    
    const addStructureFilter = () => {
        
        const { name } = filter || {}

        if (!elements.size > 0) {
            alert("Preencha todos os campos!");
            return;
        }

        // ver alguma forma de checar igualdades

        setFilters(prev => {
            return [...prev, { type: "structure", name, elements: Array.from(elements), active: true }];
        });
    }

    const handleAddFilter = (type) => {

        if (type == "structure")
            addStructureFilter()
        else if (type == "relation")
            addRelationFilter()

    }
    
    const handleToggleFilter = (index) => {
        setFilters(prev =>
            prev.map((filter, i) =>
                i === index
                    ? { ...filter, active: !filter.active }
                    : filter
            )
        );
    }

    const handleClearFilter = (type) => {
        
        if(type == "structure")
            setElements(new Set())
        else if(type == "relation")
            setFilterState({})
    }

    const setFilter = (field, value) => {
        setFilterState(prev => ({
            ...prev,
            [field]: value,
        }))
    }
    
    let filteredElements = new Set()
    filters.forEach(({ from, to, active, elements }) => {
        if(active) {
            filteredElements.add(from)    
            filteredElements.add(to)    
            
            elements.forEach(el => filteredElements.add(el))
        }
    })

    
    useEffect(() => {
        saveData("filters", {
            filters
        });
    }, [filters]);


    return {
        elements,
        elementsList: Array.from(elements),
        filteredElements,
        handleToggleElement,
        filters,
        handleAddFilter,
        handleToggleFilter,
        handleRemoveFilter,
        handleClearFilter,
        setFilter,
        filter
    } 
}
