import styles from './styles.module.css'

export const Modal = ({ children, isActive }) => {

  return (
    <div className={styles.container} data-active={isActive.toString()}>
        { children }
    </div>
  )
}
