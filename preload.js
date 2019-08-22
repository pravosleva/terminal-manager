// const WebfontLoader = require('xterm-webfont');

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  // for (const versionType of ['chrome', 'electron', 'node']) {
  //   document.getElementById(`${versionType}-version`).innerText = process.versions[versionType]
  // }
})

const getUUIDv4 = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
);

function getTextFromHTMLString(html, target) {
  if (!html || !target) {
    return false;
  }
  else {
    const fragment = document.createDocumentFragment(),
      container = document.createElement('div');
    container.innerHTML = html;
    fragment.appendChild(container);
    const targets = fragment.firstChild.getElementsByTagName(target),
      result = [];

    for (var i = 0, len = targets.length; i<len; i++) {
      result.push(targets[i].textContent || targets[i].innerText);
    }
    return result;
  }
};
// EXAMPLE:
// var spanText = getTextFromHTMLString(htmlString, 'span');

const getSettingsByID = id => {
  if (!window || !window.document) {
    return null;
  }
  const theNameAndDescription = window.document.getElementById('terms-tab-body-item--nameAndDescription_' + id);
  const titleAttrValueAsDescr = theNameAndDescription.getAttribute('title');
  const theUserHost = window.document.getElementById(`terms-tab-body-item--userHost_${id}`).innerHTML;
  const theName = getTextFromHTMLString(theNameAndDescription.innerHTML, 'strong');

  return {
    name: theName,
    description: titleAttrValueAsDescr,
    password: '',
    userHost: theUserHost
  }
};

const setSettingsToModal = settings => {
  const { name, description, password, userHost } = settings;

  window.document.getElementById('name').value = name;
  window.document.getElementById('userHost').value = userHost;
  window.document.getElementById('password').value = password;
  window.document.getElementById('description').value = description;
};

function addTerminal ({
  name,
  description,
  userHost,
  password
}) {
  // 1. Create tools:
  const id = getUUIDv4();
  const terms = window.document.getElementById('terms');
  const termsTabBody = window.document.getElementById('terms-tab-body');
  const div = window.document.createElement('div');
  const tr = window.document.createElement('tr');

  // Column 0: Name & Description
  const td0 = window.document.createElement('td');
  td0.innerHTML = `<strong>${name}</strong> <span>${getShortString(description, 30)}</span>`;
  td0.setAttribute('id', `terms-tab-body-item--nameAndDescription_${id}`);
  td0.setAttribute('title', description);
  tr.append(td0);

  // Column 1: user@host
  const td1 = window.document.createElement('td');
  td1.innerHTML = userHost;
  td1.setAttribute('id', `terms-tab-body-item--userHost_${id}`);
  tr.append(td1);

  // Column 2 - ssh status
  const td2 = window.document.createElement('td');
  td2.innerHTML = 'Disconnected';
  td2.setAttribute('id', `terms-tab-body-item--status_${id}`);
  tr.append(td2);

  // Column 3: Actions
  const td3 = window.document.createElement('td');
  const btnGroup = window.document.createElement('div');
  btnGroup.setAttribute('class', 'btn-group');
  const scrollToTerminal = window.document.createElement('button');
  scrollToTerminal.innerHTML = '<span class="icon icon-window"></span>';
  scrollToTerminal.setAttribute('class', 'btn btn-default');
  scrollToTerminal.setAttribute('title', 'Scroll to Terminal');
  scrollToTerminal.onclick = function() {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'center' }); // WAY 1
    // document.getElementById('terms').scrollBy(0, -10);
  };
  btnGroup.append(scrollToTerminal);
  const closeConnectionBtn = window.document.createElement('button');
  closeConnectionBtn.innerHTML = '<span class="icon icon-stop"></span>';
  closeConnectionBtn.setAttribute('class', 'btn btn-default');
  closeConnectionBtn.setAttribute('title', 'Stop connection');
  // closeConnectionBtn.onclick = () => {
  //   console.log('test');
  // };
  btnGroup.append(closeConnectionBtn);
  const uptimeBtn = window.document.createElement('button');
  uptimeBtn.innerHTML = '<span class="icon icon-clock"></span>';
  uptimeBtn.setAttribute('class', 'btn btn-default');
  uptimeBtn.setAttribute('title', 'conn.uptime()');
  // uptimeBtn.onclick = () => {
  //   console.log('test');
  // };
  btnGroup.append(uptimeBtn);
  const removeBtn = window.document.createElement('button');
  removeBtn.innerHTML = '<span class="icon icon-trash"></span>';
  removeBtn.setAttribute('class', 'btn btn-default');
  removeBtn.setAttribute('title', 'Remove Terminal');
  removeBtn.onclick = () => {
    try {
      removeTerminal(id);
    } catch (err) {
      console.warn(err);
    }
  };
  btnGroup.append(removeBtn);
  const reconnectBtn = window.document.createElement('button');
  reconnectBtn.innerHTML = '<span class="icon icon-cog"></span>';
  reconnectBtn.setAttribute('class', 'btn btn-default');
  reconnectBtn.setAttribute('title', 'Remove and Create with fresh settings');
  reconnectBtn.onclick = () => {
    if (MicroModal) {
      const settings = getSettingsByID(id);

      console.log(id);

      try {
        removeTerminal(id);
      } catch (err) {
        console.warn(err);
      }

      if (settings) {
        setSettingsToModal({ ...settings });

        MicroModal.show('modal-1');
      } else {
        console.warn('MicroModal could not be opened #2');
      }
    } else {
      console.warn('MicroModal could not be opened #1');
    }
  };
  btnGroup.append(reconnectBtn);
  td3.append(btnGroup);
  tr.append(td3);
  tr.setAttribute('class', `terms-tab-body-item--${id}`);

  termsTabBody.append(tr);

  // 2. Add Terminal:
  terms.append(div);
  div.setAttribute('id', id);
  const conn = openTerminal({
    terminalElm: div, // Terminal space dom elm
    settings: {
      username: userHost.split('@')[0],
      host: userHost.split('@')[1],
      password
    },
    statusElm: td2, // ssh status dom elm
  });
  closeConnectionBtn.onclick = () => {
    conn.end();
  };
  uptimeBtn.onclick = () => {
    conn.exec('uptime', function(err, stream) {
      if (err) throw err;
      stream.on('close', function(code, signal) {
        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
        // conn.end();
      }).on('data', function(data) {
        console.log('STDOUT: ' + data);
      }).stderr.on('data', function(data) {
        console.log('STDERR: ' + data);
      });
    });
    if (alertify) alertify.message('See console');
  };
};

function removeTerminal (id) {
  const terms = window.document.getElementById('terms');
  const termsTabBody = window.document.getElementById('terms-tab-body');

  terms.removeChild(window.document.getElementById(id));
  termsTabBody.removeChild(window.document.getElementsByClassName(`terms-tab-body-item--${id}`)[0]);
};

function getShortString(str, lim) { return str.length > lim ? `${str.substring(0, lim - 1)}...` : str; };

function openTerminal ({
  terminalElm,
  settings,
  statusElm
}) {
  const { username, host, password } = settings;
  // Terminal.applyAddon(WebfontLoader);

  var term = new Terminal({
    theme: {
      background: '#272b30'
    },
  }); // See also https://github.com/mscdex/ssh2#pseudo-tty-settings
  // You can also update the theme colors at runtime:
  // term.setOption('theme', { background: '#fdf6e3' });
  term.open(terminalElm);

  var Client = require('ssh2').Client;
  var conn = new Client();

  conn.on('error', function(err) {
    console.log(err);
    setSSHStatus(statusElm, String(err), 'danger');
    term.write(String(err));
  });

  conn
    .on('ready', function() {
      setSSHStatus(statusElm, 'Client ready', 'success');

      conn.shell({ term: 'xterm-256color'}, function(err, stream) {
        if (err) {
          console.log(err);
          setSSHStatus(statusElm, 'Client conn Errored #1', 'danger');
          throw err;
        }
        stream
          .on('close', function() {
            setSSHStatus(statusElm, 'Stream closed', 'muted');
            term.write('Connection closed');
            conn.end();
          })
          .on('data', function(data) {
            term.write(data.toString());
          })
          .stderr
            .on('data', function(data) {
              // console.warn(data);
              setSSHStatus(statusElm, String(data), 'danger');
              term.write(data.toString());
            });

          term.on('key', function(key, e) {
            stream.write(key);
          });
      });
    })
    .connect({
      host,
      port: 22,
      username,
      password
    });

  return conn;
};

function setSSHStatus(statusElm, str, msgType) {
  const shortStr = getShortString(str, 30);
  let resultStr = '';

  switch (msgType) {
    case 'success':
      resultStr = `<span class="icon icon-check"></span> ${shortStr}`;
      statusElm.style.color = 'green';
      break;
    case 'danger':
      resultStr = `<span class="icon icon-ban"></span> ${shortStr}`;
      statusElm.style.color = 'red';
      break;
    // case 'muted':
    default:
      resultStr = shortStr;
      statusElm.style.color = 'lightgray';
      break;
  }
  statusElm.innerHTML = resultStr;
  statusElm.setAttribute('title', str);
}

window.addTerminal = addTerminal;
