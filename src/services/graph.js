export const getBacteriaData = async () => {
    const text = await (await fetch("/bacterias.csv")).text()
    const rows = text.split("\n");
    const headers = rows.shift().split(",");
    const data = rows.map(row => {
      const values = row.split(",");
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {});
    });
    return data 
}

export const getGroups = async () => {
  const res = await fetch("/MGEs_groups.json")
  const json = await res.json()

  const filtered = Object.fromEntries(
    Object.entries(json).filter(([key, value]) => {
      return value && 
             Object.keys(value).length > 0 && 
             Object.values(value).some(arr => arr.length > 0);
    })
  );

  // Transformar no formato desejado
  const result = Object.entries(filtered).map(([accession, contigsData]) => {
    const contigs = Object.entries(contigsData).map(([contigName, elementos]) => ({
      nome: contigName,
      elementos: elementos
    }));
    
    return {
      accession: accession,
      contigs: contigs
    };
  });

  return result;
}

export const get = async (file) => {
  try {
    const res = await fetch("/"+file)
    const json = await res.json()
    return json
  } catch (e) {
    throw { error: "could not get the file" }
  }
}