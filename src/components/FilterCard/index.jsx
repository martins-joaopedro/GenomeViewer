import { useState } from "react";
import styles from "./styles.module.css";


import { IoMdRemoveCircle } from "react-icons/io";
import { IoToggleOutline } from "react-icons/io5";

import { LiaToggleOffSolid } from "react-icons/lia";
import { LiaToggleOnSolid } from "react-icons/lia";

export const FilterCard = ({ index, type, from, to, maxDistance, active, name, elements, onRemoveFilter, onToggleFilter, onAddFilter, availableElements, onToggleElement, onClearFilter, setFrom, setTo }) => {

    return (
        <div className={styles.filterCardContainer}>
            {   
                type == "structure" ? (<h4>Estrutura</h4>) : (<h4>Relação</h4>)
            } 
            <div className={styles.icons}>
                <button
                    onClick={() => onToggleFilter(index)}
                >
                    {
                        active ?
                            (
                                <LiaToggleOnSolid color="var(--icons)" />
                            ) :
                            (
                                <LiaToggleOffSolid color="var(--icons)" />
                            )
                    }
                </button>
                <button
                    onClick={() => onRemoveFilter(index)}
                >
                    <IoMdRemoveCircle color="var(--icons)" />
                </button>
            </div>

            {
                type == "relation" ? (
                    <>
                        <span>Nome: {name}</span>
                        <span>De: {from}</span>
                        <span>Para: {to}</span>
                        <span>Distância: {maxDistance}</span>
                    </>
                )
                :
                (
                    <div>
                        {elements.map(el => (
                            <span key={el}>{el} </span>
                        ))}
                    </div>
                )
            }

        </div>
    )
} 