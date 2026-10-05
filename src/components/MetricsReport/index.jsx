import styles from './styles.module.css'

export const MetricsReport = ({ metrics, index, totalGroups, accession, onFixGenome, children, fixed }) => {

   const {
    subgroupCounting,

    elementsCounting,
    totalElements,
    elementsDiversity,

    categoryCounting,
    totalCategory,
    categoryDiversity,

    contigCounting,
    totalContig,
    contigDiversity,

    isolationCounting,
    totalIsolation,
    isolationDiversity,

    isolationCategoryCounting,
    totalIsolationCategory,
    isolationCategoryDiversity

  } = metrics


  const renderDistribution = (title, list, total, diversity) => {
    return (
      <div className={styles.distributionContainer}>
        <h3>{title}</h3>

        <div className={styles.cell}>
          <p>Elementos únicos: {diversity}</p>
          <p>Total: {total}</p>
        </div>
        <div className={styles.elementsContainer}>
          {
            list?.map(({ name, counting }, i) => (
            <div key={name} className={styles.pill}>
              <h4>{i+1}) {name}</h4>
              <p>Quantidade: { counting } - ({((counting / total) * 100).toFixed(2) }%)</p>
            </div>
            ))
          } 
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainCell}>
        <button onClick={() => onFixGenome(accession)} data-fixed={fixed.toString()}>
          Accession: {accession}
        </button> 
        <p>{`Foram encontrados ${ subgroupCounting } agrupamentos em ${totalGroups} genomas!`}</p>
        <p>Índice: {index+1} / {totalGroups}</p>
        {children}
      </div>

      <div className={styles.listContainer}>
        {renderDistribution("Localização:", contigCounting, totalContig, contigDiversity)}
        {renderDistribution("Elementos:", elementsCounting, totalElements, elementsDiversity)}
        {renderDistribution("Categorias dos elementos:", categoryCounting, totalCategory, categoryDiversity)}
        {renderDistribution("Recurso:", isolationCounting, totalIsolation, isolationDiversity)}
        {renderDistribution("Categoria dos recursos:", isolationCategoryCounting, totalIsolationCategory, isolationCategoryDiversity)}
      </div>
    </div>
  )
}
