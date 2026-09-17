import { useState } from 'react'
import { PlayerContext } from './playerContext'

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState({
    participantId: null,
    quizId: null,
    displayName: '',
  })

  function joinPlayer(participant) {
    setPlayer({
      participantId: participant.id,
      quizId: participant.quiz_id,
      displayName: participant.display_name,
    })
  }

  function clearPlayer() {
    setPlayer({ participantId: null, quizId: null, displayName: '' })
  }

  return (
    <PlayerContext.Provider value={{ ...player, joinPlayer, clearPlayer }}>
      {children}
    </PlayerContext.Provider>
  )
}
