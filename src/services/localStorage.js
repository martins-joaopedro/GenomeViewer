export const saveFileInLS = (json) => {
    localStorage.setItem("file", JSON.stringify(json))
    alert("salvo");
}

export const getFileInLS = async () => {
    const string = localStorage.getItem("file")

    console.log("object")

    if(string) 
        return await JSON.parse(string)
    else alert("Arquivo JSON não encontrado!")
}