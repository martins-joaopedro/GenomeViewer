import React, { useState } from 'react'
import { Sunburst } from '../Sunburst'
import { Plot } from '../Plot'
import { Groups } from '../../screens/Groups'
import { Modal } from '../Modal'
import { Docs } from '../../screens/Docs'

export const Home = () => {

  const [docsModalState, setdocsModalState] = useState(false)

  const closeModal = () => setdocsModalState(false)
  const openModal = () => setdocsModalState(true)

  return (
    <div>
      {/* <Sunburst /> */}
      <Groups handleOpenModal={openModal} />
      <Modal isActive={docsModalState} >
        <Docs handleCloseModal={closeModal} />
      </Modal>
    </div>
  )
}
