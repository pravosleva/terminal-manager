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
  const shortDescr = getShortString(description, 30);
  td0.innerHTML = `<strong>${name}</strong> <span>${shortDescr}</span>`;
  td0.setAttribute('title', description);
  tr.append(td0);

  // Column 1: user@host
  const td1 = window.document.createElement('td');
  td1.innerHTML = `<span>${userHost}</span>`;
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
  scrollToTerminal.innerHTML = '<span class="icon icon-right-dir"></span>';
  scrollToTerminal.setAttribute('class', 'btn btn-default');
  scrollToTerminal.onclick = function() {
    // WAY 1
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  };
  btnGroup.append(scrollToTerminal);
  const removeBtn = window.document.createElement('button');
  removeBtn.innerHTML = '<span class="icon icon-block"></span>';
  removeBtn.setAttribute('class', 'btn btn-default');
  removeBtn.onclick = () => {
    removeTerminal(id);
  };
  btnGroup.append(removeBtn);
  td3.append(btnGroup);
  tr.append(td3);
  tr.setAttribute('class', `terms-tab-body-item--${id}`);

  termsTabBody.append(tr);

  // 2. Add Terminal:
  terms.append(div);
  div.setAttribute('id', id);
  openTerminal(
    div, // Terminal space dom elm
    {
      username: userHost.split('@')[0],
      host: userHost.split('@')[1],
      password
    },
    td2, // ssh status dom elm
  );
};
function removeTerminal (id) {
  const terms = window.document.getElementById('terms');
  const termsTabBody = window.document.getElementById('terms-tab-body');

  terms.removeChild(window.document.getElementById(id));
  termsTabBody.removeChild(window.document.getElementsByClassName(`terms-tab-body-item--${id}`)[0]);
};
function getShortString(str, lim) { return str.length > lim ? `${str.substring(0, lim - 1)}...` : str; };
function openTerminal (terminalElm, { username, host, password }, statusElm) {
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
      setSSHStatus(statusElm, 'Client ready', 'info');

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
              console.warn(data);
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
};
function setSSHStatus(statusElm, str, msgType) {
  statusElm.innerHTML = getShortString(str, 30);
  switch (msgType) {
    case 'info': statusElm.style.color = 'blue'; break;
    case 'danger': statusElm.style.color = 'red'; break;
    // case 'muted':
    default:
      statusElm.style.color = 'lightgray'; break;
  }
  statusElm.setAttribute('title', str);
}

window.addTerminal = addTerminal;
