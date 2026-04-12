import styles from "./styles.module.css";

export const Report = ({ report }) => {

  const { assembly_info, organism} = report || {};
  const { biosample } = assembly_info || {};
  const { attributes } = biosample || {};
  const not_interests = ["strain", "depth", "culture_collection", ""];
  const interests = [
    "sub_species",
    "geo_loc_name",
    "isolation_host",
    "isolation_source",
    "host_disease",
    "lat_lon",
    "collection_date",
    "note",
  ];
  const badValues = ["missing", "Missing", "unknown", "Unknown"];

  return (
    report && (
      <>
        <div className={styles.container}>
          <div className={styles.pill}>
            <span className={styles.title}>
              { organism?.organism_name }
            </span>
          </div>
          {attributes &&
            attributes
              ?.filter(
                ({ name, value }) =>
                  (!not_interests.includes(name) || interests.includes(name)) &&
                  !badValues.includes(value)
              )
              .map(({ name, value }, key) => (
                <div className={styles.pill} key={key}>
                  <span className={styles.title}>{name}: </span>
                  <span className={styles.value}>{value}</span>
                </div>
              ))}
        </div>
      </>
    )
  );
};
