export const saveData = (name, json) => {
    localStorage.setItem(name, JSON.stringify(json))
}

export const getData = (atr) => {
    const str = localStorage.getItem(atr)
    return JSON.parse(str)
}
