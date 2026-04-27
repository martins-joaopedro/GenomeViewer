import { get } from './graph';

export const getClassificationFile = async () => {

    const classificationFile = await get("classification.json")
    return classificationFile
}

export const getIsolationClassification = (isolationSource, json) => {
    const res = Object.entries(json).find(([chave, lista]) =>
        lista.includes(isolationSource)
    );

    return res?.at(0) || "other" 
}
