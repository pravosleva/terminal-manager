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
  const id = getUUIDv4();
  const terms = window.document.getElementById('terms');
  const termsTabBody = window.document.getElementById('terms-tab-body');
  const div = window.document.createElement('div');
  const tr = window.document.createElement('tr');

  terms.append(div);
  div.setAttribute('id', id);
  // div.innerHTML = id;
  openTerminal(
    div,
    {
      username: userHost.split('@')[0],
      host: userHost.split('@')[1],
      password
    }
  );

  // Column 0
  const td0 = window.document.createElement('td');
  const shortDescr = description.length > 30 ? `${description.substring(0, 29)}...` : description;
  td0.innerHTML = `<strong>${name}</strong> <span>${shortDescr}</span>`;
  td0.setAttribute('title', description);
  tr.append(td0);

  // Column 1
  const td1 = window.document.createElement('td');
  td1.innerHTML = `<span>${userHost}</span>`;
  tr.append(td1);

  // Column 2
  const td2 = window.document.createElement('td');
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
  td2.append(btnGroup);
  tr.append(td2);
  tr.setAttribute('class', `terms-tab-body-item--${id}`);

  termsTabBody.append(tr);
};
function removeTerminal (id) {
  const terms = window.document.getElementById('terms');
  const termsTabBody = window.document.getElementById('terms-tab-body');

  terms.removeChild(window.document.getElementById(id));
  termsTabBody.removeChild(window.document.getElementsByClassName(`terms-tab-body-item--${id}`)[0]);
};
function openTerminal (elm, { username, host, password }) {
  var term = new Terminal();
  term.open(elm);

  var Client = require('ssh2').Client;
  var conn = new Client();

  conn.connect({
    host,
    port: 22,
    username,
    password
  });

  conn.on('ready', function() {
    console.log('Client :: ready');
    conn.shell(function(err, stream) {
     if (err) throw err;
      stream.on('close', function() {
        console.log('Stream :: close');
        term.write('Connection closed')
        conn.end();
      }).on('data', function(data) {
        term.write(data.toString());
      }).stderr.on('data', function(data) {
        term.write(data.toString());
      });

      term.on('key', function(key, e) {
        stream.write(key);
      });
    });
  });
};

window.addTerminal = addTerminal;
