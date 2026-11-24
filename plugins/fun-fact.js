/* Buddy World plugin: Fun fact
   A button that makes Buddy tell a real fact about the place you are looking at (Wikipedia).
   Author: Buddy World team · Licence: MIT */
(function () {
  const BW = window.BuddyWorld;
  if (!BW) return;

  BW.addButton({
    name: 'Fun fact about here',
    emoji: '💡',
    description: 'Buddy tells you something true about this place (Wikipedia)',
    async onClick() {
      const { lat, lon } = BW.buddy;
      const geo = await BW.getJSON('https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=1000&gslimit=20&format=json&origin=*&gscoord=' + lat + '|' + lon);
      const pages = geo.query?.geosearch || [];
      if (!pages.length) { BW.say('Hmm, I don\'t know any facts about here yet! 🤔'); return; }
      const page = pages[Math.floor(Math.random() * pages.length)];
      const s = await BW.getJSON('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(page.title));
      const first = (s.extract || '').split('. ')[0] + '.';
      BW.say('💡 ' + first, 8);
      BW.card({ title: '💡 ' + page.title, html: '<div>' + BW.escape(s.extract || '') + '</div>', image: s.thumbnail?.source, link: s.content_urls?.mobile?.page, linkText: 'Read more on Wikipedia' });
    }
  });
})();
