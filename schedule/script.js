const isLocalhost = window.location.hostname === 'localhost';

window.setSchedule = async function () {
  let v, r, i;
  function defineWizedVariables() {
    v = Wized.data.v;
    r = Wized.data.r;
    i = Wized.data.i;
  }

  if (isLocalhost) {
    window.v = window.v || {};

    v.useraAvailabilitySchedule = {
      timeZone: 'Europe/Amsterdam',
      enabled: false,
      days: {
        monday: {
          enabled: true,
          to: '17:00',
          from: '09:00'
        },
        tuesday: {
          enabled: true,
          to: '17:00',
          from: '09:00'
        },
        wednesday: {
          enabled: true,
          to: '17:00',
          from: '09:00'
        },
        thursday: {
          enabled: true,
          to: '17:00',
          from: '09:00'
        },
        friday: {
          enabled: true,
          to: '17:00',
          from: '09:00'
        },
        saturday: {
          enabled: false,
          to: '14:00',
          from: '10:00'
        },
        sunday: {
          enabled: false,
          to: '09:00',
          from: '17:00'
        }
      }
    };
  } else {
    defineWizedVariables();
    // console.log('⏱️ v.useraAvailabilitySchedule', v.useraAvailabilitySchedule);
  }
  // Initialize directly without DOMContentLoaded event
  const days = [
    { key: 'monday', label: 'Maandag' },
    { key: 'tuesday', label: 'Dinsdag' },
    { key: 'wednesday', label: 'Woensdag' },
    { key: 'thursday', label: 'Donderdag' },
    { key: 'friday', label: 'Vrijdag' },
    { key: 'saturday', label: 'Zaterdag' },
    { key: 'sunday', label: 'Zondag' }
  ];

  // Format time to ensure 2 digits for minutes and hours
  const formatTimeForInput = timeStr => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  days.forEach(day => {
    const cb = document.getElementById(day.key);
    if (!cb) {
      console.warn(`Element with ID "${day.key}" not found`);
      return; // Skip this iteration if element not found
    }

    const from = document.getElementById(day.key + '-from');
    const to = document.getElementById(day.key + '-to');
    const timeInputsContainer = document.querySelector(`#${day.key}-row .time-inputs-container`);

    if (!from || !to || !timeInputsContainer) {
      console.warn(`Required elements for day "${day.key}" not found`);
      return;
    }

    // Make sure v.useraAvailabilitySchedule and its days property exist
    if (!v.useraAvailabilitySchedule || !v.useraAvailabilitySchedule.days) {
      console.error('v.useraAvailabilitySchedule or its days property is not defined');
      return;
    }

    const dayConfig = v.useraAvailabilitySchedule.days[day.key] || { enabled: false, from: '', to: '' };
    console.log(`Setting up ${day.key}:`, dayConfig);

    // Set checkbox state based on day's enabled property
    cb.checked = dayConfig.enabled;

    // Toggle visibility of time inputs based on enabled state
    timeInputsContainer.style.display = dayConfig.enabled ? 'flex' : 'none';

    // Round times to nearest half hour
    const roundToHalfHour = timeStr => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':').map(Number);
      const roundedMinutes = minutes < 15 ? '00' : minutes < 45 ? '30' : '00';
      const adjustedHours = roundedMinutes === '00' && minutes >= 45 ? (hours + 1) % 24 : hours;
      return `${String(adjustedHours).padStart(2, '0')}:${roundedMinutes}`;
    };

    from.value = formatTimeForInput(roundToHalfHour(dayConfig.from) || '08:00');
    to.value = formatTimeForInput(roundToHalfHour(dayConfig.to) || '20:00');
    from.disabled = to.disabled = !dayConfig.enabled;

    // Fix for arrow key navigation
    const handleKeyDown = (e, inputElement) => {
      // Only handle up/down arrow keys
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      e.preventDefault(); // Prevent default browser behavior

      const value = inputElement.value;
      if (!value) return;

      const [hours, minutes] = value.split(':').map(Number);
      let newHours = hours;
      let newMinutes = minutes;

      if (e.key === 'ArrowUp') {
        // Go from 00 to 30 or 30 to next hour's 00
        if (minutes === 0) {
          newMinutes = 30;
        } else {
          newMinutes = 0;
          newHours = (hours + 1) % 24;
        }
      } else if (e.key === 'ArrowDown') {
        // Go from 30 to 00 or 00 to previous hour's 30
        if (minutes === 30) {
          newMinutes = 0;
        } else {
          newMinutes = 30;
          newHours = (hours - 1 + 24) % 24; // Ensure positive number
        }
      }

      inputElement.value = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;

      // Trigger change event to update the config
      const changeEvent = new Event('change', { bubbles: true });
      inputElement.dispatchEvent(changeEvent);
    };

    // Add keydown listeners for arrow key navigation
    from.addEventListener('keydown', function (e) {
      handleKeyDown(e, from);
    });

    to.addEventListener('keydown', function (e) {
      handleKeyDown(e, to);
    });

    // Function to enforce half-hour intervals
    const enforceHalfHour = inputElement => {
      const value = inputElement.value;
      if (!value) return;

      const [hours, minutes] = value.split(':').map(Number);

      // Only allow 00 or 30 for minutes
      let newMinutes = '00';
      if (minutes > 0 && minutes < 30) {
        newMinutes = '30';
      } else if (minutes >= 30) {
        newMinutes = '00';
        const newHours = (hours + 1) % 24;
        inputElement.value = `${String(newHours).padStart(2, '0')}:${newMinutes}`;
        return;
      }

      inputElement.value = `${String(hours).padStart(2, '0')}:${newMinutes}`;
    };

    // Add event listeners to enforce half-hour intervals when typing
    from.addEventListener('input', function () {
      enforceHalfHour(from);
    });

    to.addEventListener('input', function () {
      enforceHalfHour(to);
    });

    cb.addEventListener('change', function () {
      // Ensure v.useraAvailabilitySchedule.days exists and has this day
      if (!v.useraAvailabilitySchedule.days[day.key]) v.useraAvailabilitySchedule.days[day.key] = {};

      // Update the enabled state in the config
      v.useraAvailabilitySchedule.days[day.key].enabled = cb.checked;

      // Show/hide and enable/disable time inputs based on checkbox
      timeInputsContainer.style.display = cb.checked ? 'flex' : 'none';
      from.disabled = to.disabled = !cb.checked;

      // Make sure we have valid times for enabled days
      if (cb.checked) {
        if (!v.useraAvailabilitySchedule.days[day.key].from) {
          v.useraAvailabilitySchedule.days[day.key].from = '08:00';
          from.value = '08:00';
        }
        if (!v.useraAvailabilitySchedule.days[day.key].to) {
          v.useraAvailabilitySchedule.days[day.key].to = '20:00';
          to.value = '20:00';
        }
      }
    });

    from.addEventListener('change', function () {
      if (!v.useraAvailabilitySchedule.days[day.key]) v.useraAvailabilitySchedule.days[day.key] = {};
      // Ensure we're storing the rounded value
      from.value = formatTimeForInput(roundToHalfHour(from.value));
      v.useraAvailabilitySchedule.days[day.key].from = from.value;
    });

    to.addEventListener('change', function () {
      if (!v.useraAvailabilitySchedule.days[day.key]) v.useraAvailabilitySchedule.days[day.key] = {};
      // Ensure we're storing the rounded value
      to.value = formatTimeForInput(roundToHalfHour(to.value));
      v.useraAvailabilitySchedule.days[day.key].to = to.value;
    });
  });
};

if (isLocalhost) window.setSchedule();
