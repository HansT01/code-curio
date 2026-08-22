const P2P = () => {
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  })

  return <div></div>
}

export default P2P
