function initMenu () {
    const style = document.createElement('style');
    style.textContent = `
      #menuItems {
          position: absolute;
          top: 0;
          right: 0;
          text-align: right;
          font-size: 25px;
      }
      #menuItems ul {
          margin: 0;
          background: #f9f9f9;
          border: 1px solid #f2f2f2;
          padding: 0.5em;
          position: relative;
          line-height: 1.5;
          font-size: 12px;
          text-align: left;
      }
      #menuItems ul li {
          list-style: none;
      }
      #menuItems:hover ul {
          display: block;
      }
    `;
    document.body.appendChild(style);

    const menu = document.createElement('a');
    menu.id = 'menuItems';
    menu.textContent = '☰ ';
    document.body.appendChild(menu);
    const menuList = document.createElement('ul');
    const li = document.createElement('li');
    li.textContent = 'Run this page on:';
    menuList.appendChild(li);
    menuList.setAttribute('hidden', '');
    menu.appendChild(menuList);

    [
        'bad.third-party.site',
        'good.third-party.site',
        'broken.third-party.site',
        'privacy-test-pages.glitch.me'
    ].forEach((hostname) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `https://${hostname}${location.pathname}?run`;
        a.textContent = hostname;
        menuList.appendChild(li);
        li.appendChild(a);
    });
}
initMenu();
