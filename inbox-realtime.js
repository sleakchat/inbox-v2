(async function initInbox() {
  if (localStorage.getItem('sleakTrialExpired') == 'true') return;

  const v = Wized.data.v;
  const r = Wized.data.r;
  const i = Wized.data.i;

  await Wized.requests.waitFor('get_chatbots');

  let chime = new Audio('https://sygpwnluwwetrkmwilea.supabase.co/storage/v1/object/public/app/assets/sleak-chime.mp3');
  let notificationsEnabled = false;
  let notificationsSupported = false;
  let notificationIcon = 'https://db.sleak.chat/storage/v1/object/public/app/assets/Logo%20webclip.png';

  // Check if browser supports notifications
  function checkNotificationSupport() {
    return 'Notification' in window;
  }

  // Request notification permission if not already granted
  function requestNotificationPermission() {
    notificationsSupported = checkNotificationSupport();
    console.log('Notifications supported:', notificationsSupported);

    if (notificationsSupported) {
      console.log('Current permission state:', Notification.permission);
      notificationsEnabled = Notification.permission === 'granted';
    }
  }

  // Function to request notifications from Webflow button
  window.requestNotificationsIfNeeded = function () {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return false;
    }

    // Check current permission state
    const currentPermission = Notification.permission;
    console.log('Current notification permission:', currentPermission);

    // Only request if not already granted or denied
    if (currentPermission === 'default') {
      console.log('Requesting notification permission...');

      // Try to detect Arc browser (this is a heuristic, not foolproof)
      const isArc = /Arc/.test(navigator.userAgent) || (window.navigator.userAgentData && window.navigator.userAgentData.brands.some(brand => brand.brand === 'Arc'));

      if (isArc) {
        // For Arc browser, try to show a test notification first
        console.log('Arc browser detected, trying alternative approach');
        try {
          // Create a temporary notification to trigger the permission dialog
          const testNotification = new Notification('Test Notification', {
            body: 'This is a test notification to request permission',
            icon: notificationIcon,
            requireInteraction: false
          });

          // Close it immediately
          setTimeout(() => testNotification.close(), 100);

          // Check if it worked
          setTimeout(() => {
            notificationsEnabled = Notification.permission === 'granted';
            console.log('Permission after Arc workaround:', Notification.permission);
          }, 500);
        } catch (e) {
          // If that fails, fall back to the standard approach
          console.log('Arc workaround failed, trying standard approach:', e);
          Notification.requestPermission().then(permission => {
            console.log('Permission after request:', permission);
            notificationsEnabled = permission === 'granted';
            return permission === 'granted';
          });
        }
      } else {
        // Standard approach for other browsers
        Notification.requestPermission().then(permission => {
          console.log('Permission after request:', permission);
          notificationsEnabled = permission === 'granted';
          return permission === 'granted';
        });
      }
    } else if (currentPermission === 'granted') {
      console.log('Notification permission already granted');
      notificationsEnabled = true;
      return true;
    } else if (currentPermission === 'denied') {
      console.log('Notification permission previously denied');
      notificationsEnabled = false;
      return false;
    }
  };

  // Show a notification
  function showNotification(title, body, chatId = null) {
    console.log('Show notification check:', {
      notificationsSupported,
      notificationsEnabled,
      notificationsCheckbox: i['checkbox-inbox-notifications'],
      visibilityState: document.visibilityState
    });

    if (notificationsSupported && notificationsEnabled && i['checkbox-inbox-notifications'] == true && document.visibilityState !== 'visible') {
      try {
        const notification = new Notification(title, {
          body: body,
          icon: notificationIcon,
          tag: chatId || 'sleak-notification', // Group notifications by chat ID
          requireInteraction: false // Auto-close after a while
        });

        // Add click handler to navigate to the chat
        notification.onclick = function () {
          // Focus this window
          window.focus();

          // If a chat ID was provided, switch to that chat
          if (chatId) {
            window.switchActiveChat(chatId);
          }

          // Close the notification
          this.close();
        };

        console.log('Notification shown successfully');
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  }

  // Initialize notification permission
  requestNotificationPermission();

  (async function realtimeInit() {
    const { version, client } = await Wized.requests.getClient('supabase');
    let supaClient = client;
    console.log('supa version = ', version)

    const { data } = supaClient.auth.onAuthStateChange((event, session) => {
      // console.log('auth event =', JSON.stringify({ event, time: new Date().toLocaleTimeString() }, null, 2));
      if (event === 'TOKEN_REFRESHED') {
        // console.log('TOKEN_REFRESHED event - initializing main channel in 10 seconds');
        setTimeout(() => {
          // console.log('Initializing main channel');
          adminUiChannel.unsubscribe();
          initializeMainChannel();
        }, 5000);
      }
    });

    // get ids
    const idsArray = r.get_chatbots.data.map(item => item.id);
    // const formattedIds = `in.(${idsArray.join(', ')})`;
    const userId = r.get_user.data.user.id;

    let adminUiChannel;
    let restartRequired = false;
    let reconnecting = false;
    let unsubscribeRequired = false;

    let retryCount = 0;

    async function showMessage(toastElement, messageType) {
      toastElement.style.display = 'flex';

      let messageElement;
      let setConfig = {
        opacity: 0,
        scale: 0.5,
        y: 30
      };

      // For defined message types, animate the second child and set transformOrigin
      if (messageType === 'default_user' || messageType === 'default_bot' || messageType === 'default_agent') {
        messageElement = toastElement.firstElementChild?.firstElementChild;
        if (messageType === 'default_user') {
          setConfig.transformOrigin = 'bottom left';
        } else {
          setConfig.transformOrigin = 'bottom right';
        }
      } else {
        messageElement = toastElement.firstElementChild;
      }

      gsap.set(messageElement, setConfig);

      gsap.to(messageElement, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.35,
        ease: 'power3.out'
      });
    }

    async function pushMessage(payload) {
      v.active_chat_object.messages.push(payload.new);
      const toastElement = document.querySelector(`[message_list_id='${payload.new.id}']`);
      showMessage(toastElement, payload.new.message_type);
    }

    async function handleMessageInsert(payload) {
      // console.log('💬 Postgres changes message:', payload);
      // console.log('💬💬💬 v.active_chat_object.visitor_id:', v.active_chat_object.id);

      const chat = v.allchats.find(chat => chat.id === payload.new.visitor_id);
      if (chat) {
        // console.log('🥶🥶🥶 Chat exists in v.allchats:', chat);

        // Update messages in all other arrays if they exist
        ['updatedChats', 'loadmorechats', 'newchats', 'rawchats', 'chats'].forEach(chatArrayName => {
          const chatInArray = v[chatArrayName].find(chat => chat.id === payload.new.visitor_id);
          if (chatInArray) {
            if (!chatInArray.messages) {
              chatInArray.messages = [];
            }
            chatInArray.messages.push(payload.new);
          }
        });

        // chime and notification
        if (payload.new.message_type === 'default_user') {
          if (i['checkbox-inbox-notifications'] == true) {
            chime.play().catch(error => console.error('Error playing chime:', error));

            // Show notification for new message only if it's a livechat
            const chat = v.allchats.find(chat => chat.id === payload.new.visitor_id);

            // Only show notification if this is a livechat
            if (chat?.livechat === true) {
              // Get the message content, use body if content is not available
              const messageContent = payload.new.content || payload.new.body || '';

              // Simplified title and show only the message as description
              showNotification('Nieuw bericht in Sleak', `"${messageContent}"`, payload.new.visitor_id);
            }
          }
        }
      } else {
        // console.log('🥶🥶🥶 No chat found for message with visitor_id:', payload.new.visitor_id);
      }

      // 📥 add to active chat object
      if (payload.new.visitor_id == v.active_chat_object?.id) {
        // message entrance animations

        pushMessage(payload);

        // console.log('💬💬💬 MESSAGE INSERT active chat object updated:', v.active_chat_object);
      } else {
        // console.log('💬💬💬 MESSAGE INSERT active chat is not new chat id:', v.active_chat_object);
      }
    }

    async function handleMessageUpdate(payload) {
      const chat = v.allchats.find(chat => chat.id === payload.new.visitor_id);
      if (chat) {
        // Update messages in all other arrays if they exist
        ['updatedChats', 'loadmorechats', 'newchats', 'rawchats', 'chats'].forEach(chatArrayName => {
          const chatInArray = v[chatArrayName].find(chat => chat.id === payload.new.visitor_id);
          if (chatInArray && chatInArray.messages) {
            const messageToUpdate = chatInArray.messages.find(msg => msg.id === payload.new.id);
            if (messageToUpdate) {
              Object.assign(messageToUpdate, payload.new);
            }
          }
        });
      }

      // Update message in active chat object if this is the current chat
      if (payload.new.visitor_id == v.active_chat_object?.id) {
        const messageToUpdate = v.active_chat_object.messages?.find(msg => msg.id === payload.new.id);
        if (messageToUpdate) {
          Object.assign(messageToUpdate, payload.new);
        }
      }
    }

    async function handleChatInsert(payload) {
      // console.log('New chat:', payload);

      if (payload.new.placement == 'admin') {
        return;
      }

      v.newchats.unshift(payload.new);
      window.updateInboxCounts();

      if (v.allchats.length == 0) {
        // check if it exists in chats list
        if (!v.chats.find(item => item.id == payload.new.id)) {
          v.active_chat_object = payload.new;
          window.switchActiveChat(payload.new.id);
        }
      }
    }

    async function handleChatUpdate(payload) {
      if (payload.new.placement == 'admin') return;

      // Check for human handoff request (agent_requested changed from false to true)
      if (payload.old.agent_requested === false && payload.new.agent_requested === true) {
        // Show notification for human handoff request
        const endUserEmail = payload.new.enduser_email || '';
        const notificationBody = endUserEmail ? `Email: ${endUserEmail}` : 'No email provided';

        showNotification('Nieuwe human handoff in Sleak', notificationBody, payload.new.id);
      }

      const updatedChat = v.allchats.find(chat => chat.id === payload.new.id);
      // console.log('💬 updatedChat:', payload);
      if (updatedChat) {
        // console.log('💩💩💩 Chat in array updated:', updatedChat);
        // console.log('Chat updated:', updatedChat);

        // Update chat in all other arrays if they exist
        ['updatedChats', 'loadmorechats', 'newchats', 'rawchats', 'chats'].forEach(chatArrayName => {
          const chatInArray = v[chatArrayName].find(chat => chat.id === payload.new.id);
          if (chatInArray) {
            Object.assign(chatInArray, payload.new);
            // console.log(`💩💩💩 Chat in ${chatArrayName} updated:`, chatInArray);
          }
        });

        // ⚠️ I don't know why this exists
        // if (!v.chats.find(item => item.id == v.active_chat)) {
        //   // is this first condition not redundant? edit: dont think so
        //   if (v.chats.length > 0) v.active_chat = v.chats[0].id;
        // }
      } else {
        // console.log('💩💩💩 Chat not found in allchats, adding tu updatedChats:', payload.new.id);

        // Check if any of the important properties have changed
        const relevantProperties = ['agent_requested', 'livechat', 'open', 'processed', 'enduser_email', 'updated_at'];
        let hasRelevantChanges = false;

        relevantProperties.forEach(prop => {
          if (payload.old[prop] !== payload.new[prop]) {
            // console.log(`Property ${prop} changed from ${payload.old[prop]} to ${payload.new[prop]}`);
            hasRelevantChanges = true;
          }
        });

        if (hasRelevantChanges) {
          window.updateInboxCounts();

          // Add or update chat in updatedChats
          const existingChat = v.updatedChats.find(chat => chat.id === payload.new.id);
          if (existingChat) {
            // Update existing chat in updatedChats
            Object.assign(existingChat, payload.new);
            // console.log('💩💩💩 Chat in updatedChats updated:', existingChat);
          } else {
            // Fetch operators and messages before adding to updatedChats

            // console.log('💩💩💩 Fetching operators and messages for chat before adding to updatedChats:', payload.new.id);

            // Create a copy of the new chat
            const chatToAdd = { ...payload.new };

            async function fetchOperators(chatId) {
              try {
                const { data, error } = await supaClient.from('operators').select('*').eq('chat_id', chatId);

                if (error) throw error;
                return data || [];
              } catch (err) {
                console.error('Error fetching operators:', err);
                return [];
              }
            }

            async function fetchMessages(chatId) {
              try {
                const { data, error } = await supaClient.from('messages').select('*').eq('visitor_id', chatId).order('created_at', { ascending: true }).limit(50);

                if (error) throw error;
                return data || [];
              } catch (err) {
                console.error('Error fetching messages:', err);
                return [];
              }
            }

            // Fetch both operators and messages in parallel
            Promise.all([fetchOperators(payload.new.id), fetchMessages(payload.new.id)])
              .then(([operators, messages]) => {
                chatToAdd.operators = operators;
                chatToAdd.messages = messages;

                // Now add the complete chat to updatedChats
                // console.log('💩💩💩 Adding complete chat to updatedChats:', chatToAdd);
                v.updatedChats.push(chatToAdd);
              })
              .catch(err => {
                console.error('Error fetching data for chat:', err);
              });
          }
        }
      }
      if (payload.new.id == v.active_chat_object?.id) {
        // console.log('💩💩💩 Chat in active chat object updated:', payload.new);
        Object.assign(v.active_chat_object, payload.new);
        // console.log('active chat object updated (reference):', v.active_chat_object);
      }
    }

    async function handleOperatorInsert(payload) {
      const chatToAdd = v.allchats.find(chat => chat.id === payload.new.chat_id);
      if (chatToAdd) {
        if (!chatToAdd.operators) chatToAdd.operators = [];

        // Update chat in all other arrays if they exist
        ['updatedChats', 'loadmorechats', 'newchats', 'rawchats', 'chats'].forEach(chatArrayName => {
          const chatInArray = v[chatArrayName].find(chat => chat.id === chatToAdd.id);
          if (chatInArray) {
            chatToAdd.operators.push(payload.new);
            // console.log(`💩💩💩 Chat in ${chatArrayName} updated:`, chatInArray);
          }
        });
      } else {
        // if the chat doesnt exist and a new operator gets added, it sometimes is not in any array causing updates to be missed [ e.g. when the chat state doesnt change] EDIT: now handled by chat.updated_at changes
      }

      // Update active chat object if this is the current chat
      if (v.active_chat_object?.id === payload.new.chat_id) {
        if (!v.active_chat_object.operators) v.active_chat_object.operators = [];
        v.active_chat_object.operators.push(payload.new);
      }
    }

    async function handleOperatorUpdate(payload) {
      const chatToUpdate = v.allchats.find(chat => chat.id === payload.new.chat_id);
      if (chatToUpdate) {
        ['updatedChats', 'loadmorechats', 'newchats', 'rawchats', 'chats'].forEach(chatArrayName => {
          const chatInArray = v[chatArrayName].find(chat => chat.id === chatToUpdate.id);
          if (chatInArray) {
            const operator = chatInArray.operators?.find(op => op.user_id === payload.new.user_id);
            if (operator) {
              Object.assign(operator, payload.new);
              // console.log(`💩💩💩 Chat in ${chatArrayName} updated:`, chatInArray);
            }
          }
        });
      } else if (v.active_chat_object?.id === payload.new.chat_id) {
        // if the chat doesnt exist and a new operator gets added, it sometimes is not in any array causing updates to be missed [ e.g. when the chat state doesnt change] EDIT: now handled by chat.updated_at changes
      }

      if (v.active_chat_object?.id === payload.new.chat_id) {
        const activeOperator = v.active_chat_object.operators?.find(op => op.user_id === payload.new.user_id);
        if (activeOperator) {
          Object.assign(activeOperator, payload.new);
        }
      }
    }

    async function handleMemberUpdate(payload) {
      if (v.rawMembers) {
        const member = v.rawMembers.find(member => member.id === payload.new.id);
        if (member) {
          Object.assign(member, payload.new);
        }
      }
    }

    function initializeMainChannel() {
      reconnecting = true;
      const maxRetries = 5;
      // console.log('Initializing main channel, attempt:', retryCount + 1);

      adminUiChannel = supaClient.channel(`organization_id:${v.activeOrganization}`, { config: { private: true } });
      // adminUiChannel = supaClient.channel(`visitor_id:b2796c2b-ecc7-47bc-9bd2-4cfa4046f751`, { config: { private: true } });
      (async function initializeBroadcastChannel() {
        await supaClient.realtime.setAuth();
        adminUiChannel.on('broadcast', { event: '*' }, payload => {
          // console.log('🔊🔊🔊 Broadcast message:', payload);
          const { table, eventType } = payload.payload;

          // console.log('🔍 Payload structure:', {
          //   table,
          //   eventType,
          //   fullPayload: payload.payload
          // });

          if (table === 'messages' && eventType === 'INSERT') {
            handleMessageInsert(payload.payload);
          } else if (table === 'messages' && eventType === 'UPDATE') {
            handleMessageUpdate(payload.payload);
          } else if (table === 'chats' && eventType === 'INSERT') {
            handleChatInsert(payload.payload);
          } else if (table === 'chats' && eventType === 'UPDATE') {
            handleChatUpdate(payload.payload);
          } else if (table === 'operators' && eventType === 'INSERT') {
            handleOperatorInsert(payload.payload);
          } else if (table === 'operators' && eventType === 'UPDATE') {
            handleOperatorUpdate(payload.payload);
          } else if (table === 'members' && eventType === 'UPDATE') {
            handleMemberUpdate(payload.payload);
          } else {
            console.log('❌ No matching handler for:', { table, eventType });
          }
          
        });
        // .subscribe((status, err) => {
        //   console.log('🔊🔊🔊 Broadcast channel status changed = ', status);
        //   if (err) console.log('Error:', err);
        // });
      })();

      // // Add back postgres_changes subscriptions
      // adminUiChannel
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: 'INSERT',
      //       schema: 'public',
      //       table: 'messages',
      //       filter: `chatbot_id=in.(${idsArray.join(',')})`
      //     },
      //     payload => {
      //       handleMessageInsert(payload);
      //     }
      //   )
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: 'INSERT',
      //       schema: 'public',
      //       table: 'chats',
      //       filter: `chatbot_id=in.(${idsArray.join(',')})`
      //     },
      //     payload => {
      //       handleChatInsert(payload);
      //     }
      //   )
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: 'UPDATE',
      //       schema: 'public',
      //       table: 'chats',
      //       filter: `chatbot_id=in.(${idsArray.join(',')})`
      //     },
      //     payload => {
      //       handleChatUpdate(payload);
      //     }
      //   )
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: 'INSERT',
      //       schema: 'public',
      //       table: 'operators',
      //       filter: `organization_id=eq.${v.activeOrganization}`
      //     },
      //     payload => {
      //       handleOperatorInsert(payload);
      //     }
      //   )
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: 'UPDATE',
      //       schema: 'public',
      //       table: 'operators',
      //       filter: `organization_id=eq.${v.activeOrganization}`
      //     },
      //     payload => {
      //       handleOperatorUpdate(payload);
      //     }
      //   )
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: 'UPDATE',
      //       schema: 'public',
      //       table: 'members',
      //       filter: `organization_id=eq.${v.activeOrganization}`
      //     },
      //     payload => {
      //       handleMemberUpdate(payload);
      //     }
      //   );

      adminUiChannel.subscribe((status, err) => {
        // console.log('Realtime channel status changed = ', status);
        const timestamp = new Date().toLocaleTimeString();
        // console.log('realtime event timestamp = ', timestamp);
        // console.log('reconnecting = ', reconnecting);

        // if (Wized.data.r.get_user_data.data[0].organizations[0].id == '616d0a37-03ac-47ea-91fc-c9eba9f331fc') chime.play();

        if (status == 'CHANNEL_ERROR') console.log('Error:', err);

        if (status !== 'SUBSCRIBED') {
          if (!reconnecting) {
            restartRequired = true;
            if (retryCount > maxRetries) {
              // console.log('Reached maximum retry attempts for main channel.');
              return;
            } else {
              retryCount += 1;
              // console.log('reconnecting');
              if (status !== 'CLOSED') {
                unsubscribeRequired = true;
                // console.log('status is not closed, Unsubscribing from main channel');
                adminUiChannel.unsubscribe();
              } else {
                // console.log('status is closed, Unsubscribing from main channel');
                initializeMainChannel();
              }
            }
          }
        } else {
          retryCount = 0; // reset count on successful connection
          // console.log('Subscribed - resetting retryCount, retryCount = ', retryCount);
          restartRequired = false;
          unsubscribeRequired = false;
          reconnecting = false;
        }
      });
    }

    initializeMainChannel();

    document.onvisibilitychange = () => {
      // console.log('visibility change', document.visibilityState);
      if (document.visibilityState === 'visible' && !reconnecting) {
        // if (document.visibilityState === 'visible' && !reconnecting && restartRequired) { <- this is the original line
        if (unsubscribeRequired) {
          // console.log('unsubscribing / required');
          adminUiChannel.unsubscribe();
          unsubscribeRequired = false;
          initializeMainChannel();
        } else {
          // console.log('not unsubscribing / not required ');
        }

        retryCount = 0;
        restartRequired = false;
      } else {
      } //right now doing nothing on hidden.  Another option is to set a time to close the subscription after x minutes
    };

    // (async function initializeIsTypingChannel() {
    //   let isTypingChannel;
    //   await new Promise(res => setTimeout(res, 1000));
    //   // ⚠️ maybe just add an await for a request or global variable here
    //   let currentChat = v.active_chat_object.id;
    //   let inputEventListener = false;
    //   function initializeLiveChatChannel(supaClient) {
    //     isTypingChannel = supaClient.channel('isTyping_' + currentChat);
    //     // console.log("first log", isTypingChannel);
    //     isTypingChannel.subscribe(status => {
    //       // if (status !== "SUBSCRIBED") {
    //       //   console.log("not subscribed");
    //       // } else {
    //       //   console.log("Subscribed");
    //       // }
    //       function sendIsTyping() {
    //         isTypingChannel.send({
    //           type: 'broadcast',
    //           event: 'isTypingAdmin'
    //           // payload: { message: "Subscribed to isTypingChannel" },
    //         });
    //       }
    //       // input event listener
    //       const input = document.querySelector("[w-el='admin-ui-chat-input']");
    //       let isTypingFlag = false;
    //       if (inputEventListener == false) {
    //         input.addEventListener('input', () => {
    //           if (isTypingFlag == false) {
    //             // console.log('input event');
    //             sendIsTyping();
    //             isTypingFlag = true;
    //             setTimeout(() => {
    //               isTypingFlag = false;
    //             }, 5000);
    //           }
    //         });
    //       }
    //       inputEventListener = true;
    //     });
    //   }
    //   function closeLiveChatChannel() {
    //     isTypingChannel.unsubscribe();
    //     isTypingChannel = null;
    //   }
    //   // operatorChanged event listeners
    //   window.addEventListener('joinLivechat', event => {
    //     initializeLiveChatChannel(supaClient);
    //   });
    //   window.addEventListener('leaveLivechat', event => {
    //     if (isTypingChannel) {
    //       closeLiveChatChannel(supaClient);
    //     }
    //   });
    //   if (v.active_chat?.livechat == true) {
    //     initializeLiveChatChannel(supaClient);
    //   }
    // })();
  })();
})();
