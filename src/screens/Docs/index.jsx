import styles from "./styles.module.css"
import { useEffect, useState } from 'react';

import { IoMdClose } from "react-icons/io";

export const Docs = ({ handleCloseModal }) => {

  const [data, setData] = useState(null);

  useEffect(() => {
      fetch("version.json")
          .then(response => response.json())
          .then(data => setData(data));
  }, []);

  console.log(data);

  return (
    <div className={styles.container}>
      <div className={styles.options}>
        <button className={styles.close} onClick={() => handleCloseModal()}>
            <IoMdClose />
        </button>
      </div>

      <div className={styles.hello}>
        <h3>Hello!</h3>
        <h3>Being beveloped by <a>https://github.com/martins-joaopedro</a></h3>
      </div>


      <div className={styles.versionsContainer}>
            {data?.versions.map(version => (
                <div key={version.version} className={styles.version}>
                    <h2>Versão {version.version}</h2>
                    <p>{version.date}</p>

                    <ul>
                        {version.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    </div>
  )
}
