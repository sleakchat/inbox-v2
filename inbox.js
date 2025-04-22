window.Wized = window.Wized || [];
window.Wized.push(async Wized => {
  const v = Wized.data.v;
  const r = Wized.data.r;
  const i = Wized.data.i;

  let supabase;
  const { version, client } = await Wized.requests.getClient('supabase');
  supabase = client;

  await Wized.requests.waitFor('get_user');
  const currentUser = r.get_user.data.user.id;
  console.log('currentUser = ', currentUser);

  await Wized.requests.waitFor('get_chatbots');

  await Wized.requests.waitFor('get_members');
  const currentOrganization = r.get_user_data.data[0].organizations[0];
  const currentMember = r.get_members.data.find(item => item.user_id == currentUser);
  console.log('✅ currentOrganization = ', currentOrganization);
  console.log('✅ currentMember = ', currentMember);

  (function initFilters() {
    function updateUrlParams() {
      const qp = {
        chat: v.active_chat,
        closed: i.toggle_inboxfilters_closed,
        tab: v.active_inbox_tab
      };

      // Only add filters to URL if inboxFilters is not empty
      if (v.inboxFilters && Object.keys(v.inboxFilters).length > 0) {
        qp.filters = v.inboxFilters;
      }

      const url = new URL(window.location);
      Object.entries(qp).forEach(([k, v]) => {
        url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v);
      });
      window.history.replaceState(null, '', url.toString());
    }

    // Function to update inbox tab counts
    async function updateInboxCounts() {
      try {
        // Get count for "Nieuw" tab (new/unread chats excluding those where user is an operator)
        // Use LEFT JOIN (not inner join) to include chats without operators
        const { count: newCount, error: newError } = await supabase
          .from('chats')
          .select(
            `
            id, 
            operators(user_id, status)
          `,
            { count: 'exact', head: true }
          )
          .eq('organization_id', currentOrganization.id)
          .eq('open', true)
          .eq('has_unread', true)
          .is('operators.id', null);

        if (newError) {
          console.error('Error getting new count:', newError);
          return;
        }

        // Get count for "Voor jou" tab (chats where user is a member)
        const { count: assignedCount, error: assignedError } = await supabase
          .from('chats')
          .select('*, operators!inner(*)', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .eq('open', true)
          .eq('operators.user_id', currentUser)
          .eq('operators.status', 'active');

        if (assignedError) {
          console.error('Error getting assigned count:', assignedError);
          return;
        }

        // Update UI with counts
        const newTabCounter = document.querySelector('[inbox-tab-count="nieuw"]');
        const assignedTabCounter = document.querySelector('[inbox-tab-count="voorjou"]');

        // Only show counts if they are greater than 0
        if (newCount > 0) {
          newTabCounter.textContent = newCount;
          newTabCounter.style.display = 'flex';
        } else {
          newTabCounter.style.display = 'none';
        }

        if (assignedCount > 0) {
          assignedTabCounter.textContent = assignedCount;
          assignedTabCounter.style.display = 'flex';
        } else {
          assignedTabCounter.style.display = 'none';
        }

        console.log('✅ Updated inbox counts: New:', newCount, 'Assigned:', assignedCount);
      } catch (error) {
        console.error('Error updating inbox counts:', error);
      }
    }

    // Call the count update function initially
    updateInboxCounts();
    setInterval(updateInboxCounts, 30000);

    const filters = currentMember.inbox_filters;
    console.log('✅ filters = ', filters);

    const getChatbots = r.get_chatbots.data.map(chatbot => chatbot.id);

    // Helper function to apply filters
    function applyFilters(filterObject) {
      // Filter out chatbots that are not in the availableChatbots array
      filterObject.chatbots.value = filterObject.chatbots.value.filter(chatbot => getChatbots.includes(chatbot));
      v.inboxFilters = filterObject;

      i.inboxfilter_livechat_enabled = filterObject.livechat.value;
      i.inboxfilter_assigned_enabled = filterObject.assigned.value;
      i.inboxfilter_isread = filterObject.read.value;
      if (filterObject.containstext.value) i['inboxfilters-containstext'] = filterObject.containstext.value;
    }

    // Check if there are filters in the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = urlParams.get('filters');
    let queryParamFilters = null;

    if (urlFilters) {
      try {
        queryParamFilters = JSON.parse(urlFilters);
        console.log('✅ filters from URL', queryParamFilters);
      } catch (e) {
        console.error('Error parsing filters from URL', e);
      }
    }

    if (queryParamFilters) {
      // Prioritize URL filters over database filters
      console.log('✅ using filters from URL');
      applyFilters(queryParamFilters);
    } else if (filters) {
      console.log('✅ using filters from DB');
      applyFilters(filters);
      console.log('✅ v.inboxFilterChatbots = ', v.inboxFilters);
    } else {
      console.log('✅ setting new default filters');
      applyFilters({
        livechat: {
          enabled: false,
          value: false
        },
        assigned: {
          enabled: false,
          value: false
        },
        read: {
          enabled: false,
          value: false
        },
        chatbots: {
          enabled: false,
          value: getChatbots
        },
        containstext: {
          enabled: false,
          value: ''
        }
      });

      console.log('❌ no filters ');
    }

    window.changeFilterVariable = function () {
      // const filterStatus = v.inboxFilterStatus;
      // const filterLabel = v.inboxFilterLabel;
      // const filterChatbots = Array.isArray(v.inboxFilterChatbots) ? [...v.inboxFilterChatbots] : [];

      // v.realTimeFilters = {
      //   status: filterStatus,
      //   label: filterLabel,
      //   chatbots: filterChatbots
      // };
      v.realtimeFilters = v.inboxFilters;
    };
    changeFilterVariable();

    window.setFilters = async function () {
      v.usedFilters = true;
      v.realTimeFilters = v.inboxFilters;
      console.log('v.realTimeFilters = ', v.realTimeFilters);

      const dropdownModals = document.querySelectorAll('[w-el="filters-dropdown"]');
      dropdownModals.forEach(function (modal) {
        modal.style.display = 'none';
      });

      changeFilterVariable();

      // add filters to queryparams in url
      updateUrlParams();

      v.loadmorechats = [];
      v.newchats = [];

      Wized.requests.execute('get_chats');

      const filterbar = document.querySelector("[w-el='inbox-subheader-activefilters']");
      if (v.inboxFilterLabel == 'archived') {
        filterbar.style.display = 'flex';
      } else if (v.inboxFilterStatus == 'escalated' || v.inboxFilterStatus == 'livechat') {
        filterbar.style.display = 'flex';
      } else if (v.inboxFilterLabel == 'open' && v.inboxFilterStatus == 'all') {
        filterbar.style.display = 'none';
      }
    };

    window.saveFilters = async function () {
      console.log('saveFilters');
      // v.usedFilters = true;
      const { error } = await supabase.from('members').update({ inbox_filters: v.realTimeFilters }).eq('id', currentMember.id);
      if (!error) window.showToastNotification('Filters opgeslagen', 'success');
    };

    window.addFilter = function (filter) {
      console.log('addFilter', filter);
      v.inboxFilters[filter].enabled = true;
      console.log('v.inboxFilters = ', v.inboxFilters);
    };
    window.removeFilter = function (filter) {
      v.inboxFilters[filter].enabled = false;
      console.log('v.inboxFilters = ', v.inboxFilters);
    };

    //
  })();

  if (localStorage.getItem('sleakTrialExpired') !== 'true') {
    Wized.requests.execute('get_chats');
  }

  window.switchActiveChat = async function (newChatId) {
    v.active_chat = newChatId;
    // deep copy from chats array
    v.active_chat_object = v.chats.find(chat => chat.id == newChatId);
    // has to be a request later on to prevent chat not being in chats array
    console.log('📥 new chat =', v.active_chat_object);

    // Update URL with chat ID
    const url = new URL(window.location);
    url.searchParams.set('chat', newChatId);
    window.history.replaceState(null, '', url.toString());

    // then update with realtime if visitor_id == v.active_chat ✅

    // update reactive v.messages variable to use chat object deep copy

    //

    // whenever chat changes or new message
    // update object in chat array first
    // then update chat object variable

    // also search related chats to render in header modal

    // when not in chat list but in active chat object
    // update active chat object

    // should we merge it into allchats ? ❌
    // will this go correctly with paginated chats?

    v.livechatstatus = v.chats.find(chat => chat.id == newChatId).livechat;

    if (v.chats.find(chat => chat.id === newChatId).livechat == false) {
      document.querySelector('[w-el="admin-ui-chat-input"]').setAttribute('readonly', true);
    } else {
      document.querySelector('[w-el="admin-ui-chat-input"]').removeAttribute('readonly');
    }

    Wized.requests.execute('update_chat_hasunread');

    if (window.innerWidth <= 768) {
      document.querySelector('[w-el="messages-grid-container"]').style.display = 'flex';
    }
  };

  (async function setActiveChat() {
    await Wized.requests.waitFor('get_chats');
    if (v.chats.length > 0) {
      // Check if chat ID exists in URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const chatIdFromUrl = urlParams.get('chat');

      if (chatIdFromUrl && v.chats.some(chat => chat.id === chatIdFromUrl)) {
        // Use chat ID from URL if it exists in the chats list
        window.switchActiveChat(chatIdFromUrl);
      } else {
        // Fall back to first chat in the list
        window.switchActiveChat(v.chats[0].id);
      }

      // // if livechat is false, disable input
      // if (v.chats.find(chat => chat.id === v.active_chat).livechat == false) {
      //   document.querySelector('[w-el="admin-ui-chat-input"]').setAttribute('readonly', true);
      // }
    }

    // let skeletonElement = document.querySelector("[w-el='skeleton-inbox-initial']");
    // if (skeletonElement.style.display !== 'none') {
    //   skeletonElement.style.display = 'none';
    // }
  })();

  async function fetchChat(chat_id) {
    const { data } = await supabase
      .from('chats')
      .select('*, operators(*)') // Join with operators/users
      .eq('id', chat_id)
      .single();
    return data;
  }

  // Send a system message to the chat with custom message_type_data
  async function sendSystemMessage(chat_id, message_type, message_type_data) {
    await supabase.from('messages').insert({
      visitor_id: chat_id,
      author_type: 'system',
      message_type: message_type,
      message_type_data: message_type_data,
      chatbot_id: v.chats.find(chat => chat.id === chat_id)?.chatbot_id
    });
  }
  // Compare operators and livechat status in real-time vs database state
  function matchObjects(realtimeState, dbState) {
    if (realtimeState.livechat !== dbState.livechat || realtimeState.agent_requested !== dbState.agent_requested || realtimeState.open !== dbState.open) {
      console.log('chat state does not match');
      return false;
    }

    if (realtimeState.operators.length !== dbState.operators.length) {
      return false;
    }

    const sortedRealTime = [...realtimeState.operators].sort((a, b) => a.user_id.localeCompare(b.user_id));
    const sortedDbState = [...dbState.operators].sort((a, b) => a.user_id.localeCompare(b.user_id));

    const operatorsMatch = sortedRealTime.every((realTimeOp, index) => {
      const dbOp = sortedDbState[index];
      return realTimeOp.user_id === dbOp.user_id && realTimeOp.status === dbOp.status;
    });

    if (!operatorsMatch) {
      return false;
    }

    console.log('states match');
    return true;
  }

  (async function liveChatPresence() {
    async function joinChat(user_id, chatState) {
      const remainingOperators = chatState.operators.filter(op => op.status === 'active' && op.user_id !== user_id);
      if (remainingOperators.length === 0) {
        await supabase.from('chats').update({ livechat: true, agent_requested: false }).eq('id', chatState.id);
        // deprecate static active_agent later on
      }

      if (chatState.operators.some(op => op.user_id === user_id)) {
        // Update status if operator already exists
        await supabase.from('operators').update({ status: 'active' }).eq('chat_id', chatState.id).eq('user_id', user_id);
      } else {
        // insert new operator if not already in the chat
        await supabase.from('operators').insert([{ chat_id: chatState.id, user_id: user_id, status: 'active' }]);
      }

      await sendSystemMessage(chatState.id, 'operator_changed', { event_type: 'joined', id: user_id });

      v.livechatstatus == true;
      document.querySelector('[w-el="admin-ui-chat-input"]').removeAttribute('readonly');
      let joinLivechatEvent = new CustomEvent('joinLivechat', { detail: { message: 'Joining live chat' } });
      window.dispatchEvent(joinLivechatEvent);
    }

    async function leaveChat(user_id, chatState) {
      const remainingOperators = chatState.operators.filter(op => op.status === 'active' && op.user_id !== user_id);
      if (remainingOperators.length === 0) {
        await supabase.from('chats').update({ livechat: false }).eq('id', chatState.id);
      }
      await supabase.from('operators').update({ status: 'left' }).eq('chat_id', chatState.id).eq('user_id', user_id);
      await sendSystemMessage(chatState.id, 'operator_changed', { event_type: 'left', id: user_id });

      document.querySelector('[w-el="admin-ui-chat-input"]').setAttribute('readonly', true);
      let leaveLivechatEvent = new CustomEvent('leaveLivechat', { detail: { message: 'Joining live chat' } });
      window.dispatchEvent(leaveLivechatEvent);
    }

    window.handleLiveChat = async function (realtimeState) {
      const chat_id = realtimeState.id;
      // const user_id = r.get_user.data.user.id;
      const user_id = currentUser;

      const chatState = await fetchChat(chat_id);
      console.log('dbState', chatState);
      console.log('realtimeState', realtimeState);

      if (!matchObjects(realtimeState, chatState)) {
        console.log('states do not match');
        return;
      }

      const agentIsInChat = chatState.operators.some(op => op.user_id === user_id && op.status === 'active');
      console.log('agent is in chat = ', agentIsInChat);

      if (agentIsInChat) {
        console.log('leave chat');
        await leaveChat(user_id, chatState);
      } else {
        console.log('join chat');
        await joinChat(user_id, chatState);
      }
    };
  })();

  //

  (async function livechatAssignment() {
    async function inviteOperator(chat_id, user_id) {
      await supabase.from('operators').insert([{ chat_id, user_id, status: 'invited' }]);
      console.log(`Operator ${user_id} invited to chat ${chat_id}`);
    }

    async function updateChatAgentRequested(chat_id) {
      await supabase.from('chats').update({ agent_requested: true }).eq('id', chat_id);
      console.log(`chat.agent_requested set to true for chat ${chat_id}`);
    }

    window.assignLivechat = async function (realtimeState, user_id) {
      const chat_id = realtimeState.id;

      const chatState = await fetchChat(chat_id);
      console.log('dbState', chatState);
      console.log('realtimeState', realtimeState);

      if (!matchObjects(realtimeState, chatState)) {
        console.log('states do not match');
        return;
      }

      window.closeAllPopupModals();

      // Invite the operator (always)
      await inviteOperator(chat_id, user_id);
      await sendSystemMessage(chat_id, 'agent_requested', { type: 'assign_manually', assigned_to: user_id, assigned_by: currentUser });

      if (!chatState.livechat && !chatState.agent_requested) {
        await updateChatAgentRequested(chat_id);
      }
    };
  })();

  //

  function chatListRemoveChat(chatState) {
    console.log('removechat');
    const chatListItem = document.querySelector(`#${CSS.escape(chatState.id)}`);
    if (!chatListItem) return;

    chatListItem.style.transformOrigin = 'top';

    gsap.to(chatListItem, {
      scale: 0,
      duration: 0.2,
      ease: 'power4.inOut',
      onComplete: () => {
        gsap.to(chatListItem, { height: 0, duration: 0.1, ease: 'power4.inOut' });
        setTimeout(() => {
          chatListItem.style.display = 'none';
        }, 100);
      }
    });
  }

  function chatListAddChat(chatState) {
    const chatListItem = document.querySelector(`#${CSS.escape(chatState.id)}`);
    if (!chatListItem) return;

    chatListItem.style.display = ''; // Reset display property
    chatListItem.style.transformOrigin = 'top';
    chatListItem.style.height = '0px';
    chatListItem.style.transform = 'scale(0)';

    setTimeout(() => {
      gsap.to(chatListItem, {
        height: 'auto',
        scale: 1,
        duration: 0.2,
        ease: 'power4.inOut'
      });
    }, 10);
  }

  (async function chatClosing() {
    // what if there are operators? Or livechat = true?

    window.closeChat = async function (realtimeState) {
      const chat_id = realtimeState.id;

      const chatState = await fetchChat(chat_id);
      console.log('dbState', chatState);
      console.log('realtimeState', realtimeState);

      if (!matchObjects(realtimeState, chatState)) {
        console.log('states do not match');
        return;
      }

      const objectInChatsList = v.allchats.some(chat => chat.id == chatState.id);

      if (v.active_inbox_tab == 'nieuw') {
        console.log('✅ NIEUW');
        if (chatState.open == true) {
          chatListRemoveChat(chatState);
        } else {
          chatListAddChat(chatState);
        }
      } else if (v.active_inbox_tab !== 'nieuw') {
        if (i.toggle_inboxfilters_closed == true) {
          console.log('✅ closed is true');
          if (chatState.open == true) {
            chatListAddChat(chatState);
          } else {
            chatListRemoveChat(chatState);
          }
        } else {
          console.log('✅ closed is false');
          if (chatState.open == true) {
            chatListRemoveChat(chatState);
          } else {
            chatListAddChat(chatState);
          }
        }
      }

      if (chatState.open == true) {
        // close chat
        await supabase.from('chats').update({ open: false }).eq('id', chatState.id);
        await sendSystemMessage(chat_id, 'chat_closed', {});
      } else if (chatState.open == false) {
        // open chat
        await supabase.from('chats').update({ open: true }).eq('id', chatState.id);
        await sendSystemMessage(chat_id, 'chat_opened', {});
      }
    };
  })();
  //
});
