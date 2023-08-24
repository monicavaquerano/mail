document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#details-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function view_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      // Print email
      // console.log(email);

      // Show the mailbox and hide other views
      document.querySelector('#details-view').style.display = 'block';
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';

      document.querySelector('#details-view').innerHTML = `
      <ul class="list-group mb-3">
        <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
        <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
        <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
      </ul>
      <p>${email.body}</p>
      `

      // Change read/unread status
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
      }

      // Change archived/unarchived status
      const btnArchived = document.createElement('button');
      btnArchived.className = email.archived ? "btn btn-secondary my-3" : "btn btn-primary my-3";
      btnArchived.innerHTML = email.archived ? "Archived" : "Unarchived";
      btnArchived.addEventListener('click', function () {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        })
          .then(() => { load_mailbox('archive') })
      });
      document.querySelector('#details-view').append(btnArchived)

      // Reply button
      const btnReply = document.createElement('button');
      btnReply.className = "btn btn-primary my-3 ms-3";
      btnReply.innerHTML = "Reply";
      btnReply.addEventListener('click', () => {
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;
        let subject = email.subject;
        if (subject.split(' ', 1)[0] != "Re:") {
          subject = `Re: ${email.subject}`
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
      });
      document.querySelector('#details-view').append(btnReply);

    });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#details-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET emails from that mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // ... do something else with emails ...
      emails.forEach(email => {
        // Create a div element for each
        const newEmail = document.createElement('div');
        newEmail.className = "list-group"

        // Change background color
        const bgColor = email.read ? 'list-group-item-secondary' : '';

        newEmail.innerHTML = `
          <a href="#" class="list-group-item list-group-item-action ${bgColor}">
            <div class="d-flex w-100 justify-content-between ">
              <p class="fw-bold mb-1">${email.sender}</p><p class="fw-normal mb-1">${email.subject}</p><p class="fw-light mb-1">${email.timestamp}</p>
            </div>
          </a>
        `;

        // Click event to view email
        newEmail.addEventListener('click', () => { view_email(email.id) });
        document.querySelector('#emails-view').append(newEmail);
      });


    });
}

function send_email(event) {
  event.preventDefault();
  // Input fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  // API connection 
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
    })
    // Agregar un catch
    .catch(error => {
      console.log('Error:', error);
    })
    .then(() => { load_mailbox('sent') });

}
