(async function initInbox() {
  if (localStorage.getItem('sleakTrialExpired') == 'true') return;

  const v = Wized.data.v;
  const r = Wized.data.r;
  const i = Wized.data.i;

  await Wized.requests.waitFor('get_chatbots');

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
            // console.log('💬💬💬 New message payload:', payload.new);
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

              // chime
              if (payload.new.message_type === 'default_user') {
                if (i['checkbox-inbox-notifications'] == true) {
                  chime.play().catch(error => console.error('Error playing chime:', error));
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
            if (payload.new.placement == 'admin') return;

            const updatedChat = v.allchats.find(chat => chat.id === payload.new.id);
            // console.log('💩💩💩💩💩💩💩💩💩 updatedChat:', payload);
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
              // console.log('��💩💩 Chat in active chat object updated:', payload.new);
              Object.assign(v.active_chat_object, payload.new);
              // console.log('active chat object updated (reference):', v.active_chat_object);
            }
          }
        )

        // operators table
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'operators' }, payload => {
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
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'operators' }, payload => {
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
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'operators' }, payload => {
          const chat = v.allchats.find(chat => chat.id === payload.old.chat_id);
          if (chat) {
            chat.operators = chat.operators.filter(op => op.user_id !== payload.old.user_id);

            if (v.active_chat_object?.id === payload.old.chat_id) {
              v.active_chat_object.operators = v.active_chat_object.operators.filter(op => op.user_id !== payload.old.user_id);
            }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'members',
            filter: `organization_id=eq.${v.activeOrganization}`
          },
          payload => {
            if (v.rawMembers) {
              const member = v.rawMembers.find(member => member.id === payload.new.id);
              if (member) {
                Object.assign(member, payload.new);
              }
            }
          }
        );

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
    // ⚠️ maybe just add an await for a request or global variable here
    let currentChat = v.active_chat_object.id;
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
