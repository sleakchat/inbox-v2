(async function initInbox() {
  if (localStorage.getItem('sleakTrialExpired') == 'true') return;

  const v = Wized.data.v;
  const r = Wized.data.r;
  const i = Wized.data.i;

  await Wized.requests.waitFor('get_chatbots');

  // Wized.requests.execute('get_chats_rpc');

  let chime = new Audio('https://sygpwnluwwetrkmwilea.supabase.co/storage/v1/object/public/app/assets/sleak-chime.mp3');

  (async function realtimeInit() {
    // init supa client
    let supaClient;
    const { version, client } = await Wized.requests.getClient('supabase');
    supaClient = client;

    const { data } = supaClient.auth.onAuthStateChange((event, session) => {
      // console.log(event, session);
      const timestamp = new Date().toLocaleTimeString();
      // console.log('auth event timestamp = ', timestamp);
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
    const formattedIds = `in.(${idsArray.join(', ')})`;
    const userId = r.get_user.data.user.id;

    let adminUiChannel;
    let restartRequired = false;
    let reconnecting = false;
    let unsubscribeRequired = false;

    let retryCount = 0;

    async function showMessage(toastElement) {
      toastElement.style.display = 'flex';
      toastElement.style.opacity = 0;
      toastElement.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toastElement.style.opacity = 1;
          toastElement.style.transform = 'translateY(0)';
        });
      });
    }

    async function pushMessage(payload) {
      v.active_chat_object.messages.push(payload.new);
      // setTimeout(() => {}, 2000);

      const toastElement = document.querySelector(`[message_list_id='${payload.new.id}']`);
      showMessage(toastElement);
    }

    function initializeMainChannel() {
      reconnecting = true;

      const maxRetries = 5;

      // console.log('Initializing main channel, attempt:', retryCount + 1);

      adminUiChannel = supaClient.channel('adminUi_' + userId);
      // console.log('adminUiChannel', adminUiChannel);

      adminUiChannel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chatbot_id=${formattedIds}`
          },
          payload => {
            console.log('💬💬💬 New message payload:', payload.new);
            console.log('💬💬💬 New message visitor_id:', payload.new.visitor_id);
            console.log('💬💬💬 v.active_chat_object.visitor_id:', v.active_chat_object.id);
            console.log('💬💬💬 v.active_chat:', v.active_chat);

            const chat = v.allchats.find(chat => chat.id === payload.new.visitor_id);
            if (chat) {
              console.log('💬💬💬 Chat exists in v.allchats:', chat);
              if (!chat.messages) {
                chat.messages = [];
              }
              chat.messages.push(payload);

              // chime
              if (payload.new.message_type === 'default_user') {
                if (i['checkbox-inbox-notifications'] == true) {
                  chime.play().catch(error => console.error('Error playing chime:', error));
                }
              }
            } else {
              console.log('💬💬💬 No chat found for message with visitor_id:', payload.new.visitor_id);
            }

            // 📥 add to active chat object
            if (payload.new.visitor_id == v.active_chat_object.id) {
              // message entrance animations

              pushMessage(payload);

              console.log('💬💬💬 active chat object updated:', v.active_chat_object);
            }
          }
        )

        // insert chats
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chats',
            filter: `chatbot_id=${formattedIds}`
          },
          payload => {
            // console.log('New chat:', payload);

            if (v.allchats.length == 0) {
              v.active_chat = payload.new.id;
              window.switchActiveChat(payload.new.id);
            }

            if (payload.new.placement !== 'admin') {
              v.newchats.unshift(payload.new);
            }
          }
        )

        // update chats
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chats',
            filter: `chatbot_id=${formattedIds}`
          },
          payload => {
            if (payload.new.placement !== 'admin') {
              const updatedChat = v.allchats.find(chat => chat.id === payload.new.id);
              if (updatedChat) {
                Object.assign(updatedChat, payload.new);
                // console.log('Chat updated:', updatedChat);

                if (!v.chats.find(item => item.id == v.active_chat)) {
                  // is this first condition not redundant? edit: dont think so
                  if (v.chats.length > 0) v.active_chat = v.chats[0].id;
                }
              }

              if (payload.new.id == v.active_chat_object.id) {
                // make deep copy and update active chat object
                // v.active_chat_object = JSON.parse(JSON.stringify(updatedChat));
                Object.assign(v.active_chat_object, payload.new);
                // console.log('active chat object updated (reference):', v.active_chat_object);
              }
            }
          }
        )

        // operators table
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'operators' }, payload => {
          const chat = v.allchats.find(chat => chat.id === payload.new.chat_id);
          if (chat) {
            if (!chat.operators) chat.operators = [];
            chat.operators.push(payload.new);
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'operators' }, payload => {
          const chat = v.allchats.find(chat => chat.id === payload.new.chat_id);
          if (chat) {
            const index = chat.operators.findIndex(op => op.user_id === payload.new.user_id);
            if (index !== -1) {
              chat.operators[index] = payload.new;
            }
          }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'operators' }, payload => {
          const chat = v.allchats.find(chat => chat.id === payload.old.chat_id);
          if (chat) {
            chat.operators = chat.operators.filter(op => op.user_id !== payload.old.user_id);
          }
        });

      ////

      adminUiChannel.subscribe((status, err) => {
        // console.log('Messaging channel status changed = ', status);
        const timestamp = new Date().toLocaleTimeString();
        // console.log('realtime event timestamp = ', timestamp);
        // console.log('reconnecting = ', reconnecting);

        // if (Wized.data.r.get_user_data.data[0].organizations[0].id == '616d0a37-03ac-47ea-91fc-c9eba9f331fc') chime.play();

        // if (status == 'CHANNEL_ERROR') console.log('Error:', err);

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

    // visibility change events
    document.onvisibilitychange = () => {
      // console.log('visibility change', document.visibilityState);
      if (document.visibilityState === 'visible' && !reconnecting) {
        // if (document.visibilityState === 'visible' && !reconnecting && restartRequired) { <- this is the original line
        // console.log('restart required', restartRequired);
        // if (unsubscribeRequired) {
        adminUiChannel.unsubscribe();
        unsubscribeRequired = false;
        // }
        initializeMainChannel();
        retryCount = 0;
        restartRequired = false;
      } else {
      } //right now doing nothing on hidden.  Another option is to set a time to close the subscription after x minutes
    };

    // isTyping channel broadcast

    let isTypingChannel;
    await new Promise(res => setTimeout(res, 1000));
    let currentChat = v.active_chat;
    let inputEventListener = false;

    function initializeLiveChatChannel(supaClient) {
      isTypingChannel = supaClient.channel('isTyping_' + currentChat);

      // console.log("first log", isTypingChannel);

      isTypingChannel.subscribe(status => {
        // if (status !== "SUBSCRIBED") {
        //   console.log("not subscribed");
        // } else {
        //   console.log("Subscribed");
        // }

        function sendIsTyping() {
          isTypingChannel.send({
            type: 'broadcast',
            event: 'isTypingAdmin'
            // payload: { message: "Subscribed to isTypingChannel" },
          });
        }

        // input event listener
        const input = document.querySelector("[w-el='admin-ui-chat-input']");
        let isTypingFlag = false;

        if (inputEventListener == false) {
          input.addEventListener('input', () => {
            if (isTypingFlag == false) {
              // console.log('input event');
              sendIsTyping();
              isTypingFlag = true;
              setTimeout(() => {
                isTypingFlag = false;
              }, 5000);
            }
          });
        }
        inputEventListener = true;
      });
    }

    function closeLiveChatChannel() {
      isTypingChannel.unsubscribe();
      isTypingChannel = null;
    }

    // operatorChanged event listeners
    window.addEventListener('joinLivechat', event => {
      initializeLiveChatChannel(supaClient);
    });
    window.addEventListener('leaveLivechat', event => {
      if (isTypingChannel) {
        closeLiveChatChannel(supaClient);
      }
    });

    if (v.active_chat?.livechat == true) {
      initializeLiveChatChannel(supaClient);
    }
  })();
})();
