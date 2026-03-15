// JaaSMeeting: Embeds 8x8 JaaS video with custom UI hidden
import React, { useEffect, useRef } from 'react';

export default function JaaSMeeting({ roomName, jwt, onReady, className = '' }) {
  const iframeRef = useRef(null);
  const jaasInstance = useRef(null);

  useEffect(() => {
    // Load JaaS script if not already present
    if (!window.JaaS) {
      const script = document.createElement('script');
      script.src = 'https://8x8.vc/vpaas-magic-cookie/jaas-sdk.js';
      script.async = true;
      script.onload = initMeeting;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    } else {
      initMeeting();
    }

    function initMeeting() {
      if (!window.JaaS || !iframeRef.current) return;

      const options = {
        roomName,
        parentNode: iframeRef.current,
        jwt,
        configOverwrite: {
          disableDeepLinking: true,
          disableInviteFunctions: true,
          enableWelcomePage: false,
          toolbarButtons: [],
          prejoinPageEnabled: false,
          disableThirdPartyRequests: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Teacher',
        },
      };

      jaasInstance.current = new window.JaaS.JitsiMeetExternalAPI('8x8.vc', options);
      jaasInstance.current.addEventListener('videoConferenceJoined', () => {
        onReady?.();
      });

      // Store in window for external control
      window.jaasInstance = jaasInstance.current;
    }

    return () => {
      if (jaasInstance.current) {
        jaasInstance.current.dispose();
        window.jaasInstance = null;
      }
    };
  }, [roomName, jwt, onReady]);

  return <div ref={iframeRef} className={`w-full h-full ${className}`} style={{ background: '#000' }} />;
}