// Keep the native ISO date value and validation; enhance only the calendar UI.
export function enhanceDates(root) {
  for (const input of root.querySelectorAll('input[type="date"]')) {
    if (input.closest('.date-control')) continue;
    const wrapper = document.createElement('div');
    wrapper.className = 'date-control';
    input.before(wrapper);
    wrapper.append(input);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'date-toggle';
    toggle.setAttribute('aria-label', 'Kalender öffnen');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'dialog');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v5m8-5v5M4 11h16"/></svg>';
    const popup = document.createElement('div');
    popup.className = 'date-calendar';
    popup.hidden = true;
    popup.id = 'calendar-' + input.id;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', 'Datum auswählen');
    toggle.setAttribute('aria-controls', popup.id);
    wrapper.append(toggle, popup);
    const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const parse = value => /^\d{4}-\d\d-\d\d$/.test(value) ? new Date(value + 'T12:00:00') : null;
    const today = () => { const d = new Date(); d.setHours(12,0,0,0); return d; };
    const allowed = date => (!input.min || iso(date) >= input.min) && (!input.max || iso(date) <= input.max);
    let cursor = today();
    function close(restore = true) {
      popup.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      if (restore) toggle.focus();
    }
    function choose(date) {
      input.value = date ? iso(date) : '';
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
      close();
    }
    function moveMonth(amount) {
      const day = cursor.getDate();
      cursor = new Date(cursor.getFullYear(), cursor.getMonth()+amount, 1, 12);
      cursor.setDate(Math.min(day, new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()));
      render();
    }
    function render() {
      const year = cursor.getFullYear(), month = cursor.getMonth();
      const start = (new Date(year,month,1).getDay()+6)%7;
      const count = new Date(year,month+1,0).getDate();
      const label = cursor.toLocaleDateString('de-DE',{month:'long',year:'numeric'});
      popup.innerHTML = `<div class="date-calendar-head"><button type="button" data-month="-1" aria-label="Vorheriger Monat">‹</button><strong aria-live="polite">${label}</strong><button type="button" data-month="1" aria-label="Nächster Monat">›</button></div><div class="date-weekdays" aria-hidden="true">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=>`<span>${d}</span>`).join('')}</div><div class="date-days" role="grid" aria-label="${label}"></div><div class="date-calendar-foot"><button type="button" data-today>Heute</button><button type="button" data-clear>Datum löschen</button></div>`;
      const grid = popup.querySelector('.date-days');
      for(let cell=0; cell<Math.ceil((start+count)/7)*7; cell+=7) {
        const row = document.createElement('div'); row.setAttribute('role','row');
        for(let column=0;column<7;column++) {
          const day = cell+column-start+1;
          const slot = document.createElement('span'); slot.setAttribute('role','gridcell');
          if(day>0 && day<=count) {
            const date = new Date(year,month,day,12), value = iso(date);
            const button = document.createElement('button');button.type='button';button.textContent=day;
            button.dataset.date=value;button.tabIndex=day===cursor.getDate()?0:-1;
            button.disabled=!allowed(date);
            button.setAttribute('aria-label',date.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
            slot.setAttribute('aria-selected',String(input.value===value));
            if(value===input.value) button.classList.add('selected');
            if(value===iso(today())) button.setAttribute('aria-current','date');
            button.onclick=()=>choose(date); slot.append(button);
          }
          row.append(slot);
        }
        grid.append(row);
      }
      popup.querySelectorAll('[data-month]').forEach(b=>b.onclick=()=>{
        const amount=Number(b.dataset.month);
        moveMonth(amount);
        popup.querySelector(`[data-month="${amount}"]`).focus({preventScroll:true});
      });
      popup.querySelector('[data-today]').disabled=!allowed(today());
      popup.querySelector('[data-today]').onclick=()=>choose(today());
      popup.querySelector('[data-clear]').onclick=()=>choose(null);
    }
    toggle.onclick=()=>{
      if(!popup.hidden) return close();
      cursor=parse(input.value)||today(); render();popup.hidden=false;
      toggle.setAttribute('aria-expanded','true');
      popup.querySelector('.date-days button[tabindex="0"]:not(:disabled)')?.focus({preventScroll:true});
      popup.scrollIntoView({block:'nearest'});
    };
    popup.addEventListener('keydown',event=>{
      const button=event.target.closest('[data-date]');
      if(!button) return;
      cursor=parse(button.dataset.date);
      const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-(cursor.getDay()+6)%7,End:6-(cursor.getDay()+6)%7};
      if(event.key in offsets){event.preventDefault();cursor.setDate(cursor.getDate()+offsets[event.key]);render();}
      else if(event.key==='PageUp'||event.key==='PageDown'){event.preventDefault();moveMonth(event.key==='PageUp'?-1:1);}
      else return;
      popup.querySelector('.date-days button[tabindex="0"]:not(:disabled)')?.focus({preventScroll:true});
    });
    wrapper.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!popup.hidden){event.preventDefault();event.stopPropagation();close();}
    });
    wrapper.addEventListener('focusout',()=>setTimeout(()=>{if(!wrapper.contains(document.activeElement))close(false);},0));
    root.addEventListener('pointerdown',event=>{if(!wrapper.contains(event.target))close(false);});
  }
}
