(function () {
  const funnelytics = {
    cookie: '_fs',
    origin: 'https://track-v3.funnelytics.io',
    refKey: '_fsRef',
    project: null,
    session: null,
    step: null,
    stepping: !1,
    steps: [],
    getSession: function () {
      var e = funnelytics.url.params.toObject(window.location.search.substr(1)),
        n = funnelytics.cookies.get(funnelytics.cookie);
      if (e[funnelytics.cookie]) {
        var t = e[funnelytics.cookie];
        return funnelytics.cookies.set(funnelytics.cookie, t), t;
      }
      return n;
    },
    client: {
      isBot: function () {
        return new RegExp(/funnelyticsbot|googlebot|facebookexternalhit|facebookcatalog|FacebookBot|Twitterbot|Facebot|bot|crawler|spider|robot|crawling/i).test(navigator.userAgent);
      },
    },
    projects: {
      _settings: {},
      _loaded: false,
      shouldTrackProject: function() {
        const isTrackingEnabled = funnelytics.projects._settings.hasOwnProperty('tracking') ? funnelytics.projects._settings.tracking : true;
        const isLocked = funnelytics.projects._settings.hasOwnProperty('is_locked') ? funnelytics.projects._settings.is_locked : false;

        return isTrackingEnabled && !isLocked;
      },
      getSettings: function (e) {
        if (funnelytics.projects._loaded) {
          var n = funnelytics.projects._settings;
          if (Promise && !e)
            return new Promise(function (e, t) {
              return e(n);
            });
          e && 'function' == typeof e && e(null, n);
        } else {
          var t = new XMLHttpRequest();
          t.open('GET', funnelytics.origin + '/settings/' + funnelytics.project),
            t.addEventListener('load', function () {
              var n = JSON.parse(t.responseText);
              if (t.status >= 200 && t.status < 300) {
                if (((funnelytics.projects._settings = n), (funnelytics.projects._loaded = !0), Promise && !e))
                  return new Promise(function (e, n) {
                    return e(funnelytics.projects._settings);
                  });
                if (!e || 'function' != typeof e) return;
                e(null, funnelytics.projects._settings);
              } else {
                if (Promise && !e)
                  return new Promise(function (e, t) {
                    return t(n);
                  });
                e && 'function' == typeof e && e(n);
              }
            }),
            t.send();
        }
      },
      fetchSettings: function () {
        // If the settings are already loaded - return them
        if (funnelytics.projects._loaded) {
            var settings = funnelytics.projects._settings;
            return Promise.resolve(settings);
        }
    
        // If settings are not loaded - fetch them
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', funnelytics.origin + '/settings/' + funnelytics.project);
    
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    var data = JSON.parse(xhr.responseText);
                    funnelytics.projects._settings = data;
                    funnelytics.projects._loaded = true;
                    resolve(data);
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            };
    
            xhr.onerror = function () {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            };
    
            xhr.send();
        });
      },
      getWhitelistedDomains: function (e) {
        funnelytics.projects.getSettings(function (n, t) {
          if (e && 'function' == typeof e)
            if (n) e(n);
            else {
              for (var s, i = [], o = 0; o < t.domains.length; o++) (s = t.domains[o].domain), i.push(s.slice(0, s.length - 1));
              e(null, i);
            }
        });
      },
      _inputListeners: {},
      addDOMEvents: function () {
        var e = document.readyState;
        'complete' === e || 'loaded' === e || 'interactive' === e
          ? (funnelytics.projects.addCrossDomainParameters(), funnelytics.projects.startMonitoringInputs())
          : document.addEventListener('DOMContentLoaded', function () {
              funnelytics.projects.addCrossDomainParameters(), funnelytics.projects.startMonitoringInputs();
            });
      },
      _inpuChangeFunction: function (e) {
        if (!funnelytics.projects.shouldTrackProject()) {
          return;
        }

        if (!/.+@.+\..+/.test(e.target.value)) return;
        const n = funnelytics.projects._inputListeners[e.target];
        n && clearTimeout(n),
          (funnelytics.projects._inputListeners[e.target] = setTimeout(function () {
            var n = new XMLHttpRequest();
            n.open('POST', funnelytics.origin + '/set-attributes'),
              n.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'),
              n.send(
                'd=' + encodeURIComponent(JSON.stringify({ session: funnelytics.session, project: funnelytics.project, attributes: { email: e.target.value } }))
              ),
              (funnelytics.projects._inputListeners[e.target] = null);
          }, 1e3));
      },
      _inputChecker: null,
      startMonitoringInputs: function () {
        funnelytics.projects.addInputListeners(), (funnelytics.projects._inputChecker = window.setInterval(funnelytics.projects.addInputListeners, 1e3));
      },
      stopMonitoringForInputs: function () {
        window.clearInterval(funnelytics.projects._inputChecker);
      },
      addInputListeners: function () {
        for (var e, n = document.getElementsByTagName('input'), t = 0; t < n.length; t++)
          (e = n[t]), null !== funnelytics.projects._inputListeners[e] && e.addEventListener('input', funnelytics.projects._inpuChangeFunction);
      },
      addCrossDomainParameters: function () {
        funnelytics.projects.getWhitelistedDomains(function (e, n) {
          for (var t, s = 0; s < (t = document.getElementsByTagName('a')).length; s++)
            if (
              t[s].href &&
              window.location.hostname != t[s].hostname &&
              (-1 != n.indexOf(t[s].hostname) || -1 != n.indexOf('www.' + t[s].hostname)) &&
              funnelytics.session &&
              funnelytics.url.isURL(t[s].href)
            ) {
              var i = funnelytics.url.params.fromURL(t[s].href, funnelytics.url.params.toArray),
                o = funnelytics.projects.getRevisedParameters(i);
              t[s].href = funnelytics.projects.addParamsToLink(t[s].href, o);
            }
        });
      },
      getRevisedParameters(e) {
        for (var n = !1, t = 0; t < e.length; t++) e[t].key === funnelytics.cookie && ((n = !0), funnelytics.session && (e[t].value = funnelytics.session));
        return (
          !n &&
            funnelytics.session &&
            e.push({ key: funnelytics.cookie, value: funnelytics.session, hasEquals: !0 }) &&
            e.push({ key: funnelytics.refKey, value: funnelytics.projects.getCrossDomainRefValue(), hasEquals: !0 }),
          e
        );
      },
      addParamsToLink(link, paramsArr) {
        const url = new URL(link);
        paramsArr.forEach((param) => {
          if (!url.searchParams.has(param.key)) {
            url.searchParams.set(param.key, param.value);
          }
        });
        return url.toString();
      },
      getCrossDomainRefValue() {
        return document.location.origin + document.location.pathname.replace(/\/?(\?|#|$)/, '/$1');
      },
    },
    cookies: {
      getDomain: function () {
        var e = window.location.hostname.split('.');
        return e.length > 2 && (e = e.slice(e.length - 2)), e;
      },
      all: function () {
        for (var e, n = {}, t = 0; t < (cookies = document.cookie.split('; ')).length; t++) n[(e = cookies[t].split('='))[0]] = e[1];
        return n;
      },
      get: function (e) {
        return funnelytics.cookies.all()[e];
      },
      set: function (cookieName, cookieValue) {
        const domainSegments = window.location.hostname.split('.');
  
        if (domainSegments.length < 2) return;
  
        const cookieString = cookieName + '=' + cookieValue + '; path=/; SameSite=None; Secure;';
        const expiry = cookieValue === null ? '; expires=Thu, 01 Jan 1970 00:00:00 UTC;' : '; expires=Thu, 01 Jan 2038 00:00:00 UTC;';
  
        for (let i = domainSegments.length - 2; i >= 0; i--) {
          const currentDomain = domainSegments.slice(i).join('.');
  
          document.cookie = cookieString + ' domain=' + currentDomain + expiry;
  
          // Break if the cookie is successfully set and retrievable.
          if (funnelytics.cookies.get(cookieName)) {
            break;
          }
        }
      },
      remove: function (e) {
        funnelytics.cookies.set(e);
      },
      expire: function(cookieName) {
        const domain = funnelytics.cookies.getDomain() ? funnelytics.cookies.getDomain().join('.') : '';
        document.cookie = cookieName + "=" + ";path=/; SameSite=None; Secure;"+
                ((domain)?";domain="+domain:"") +
                ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
      },
    },
    url: {
      regex: new RegExp(/.*:\/\/.*\..*/),
      isURL: function (e) {
        return funnelytics.url.regex.test(e);
      },
      parse: function (e) {
        var n = document.createElement('a');
        return (n.href = e), n;
      },
      params: {
        regex: new RegExp(/.*:\/\/.*\..*\?/),
        fromURL: function (e, n) {
          var t = n || funnelytics.url.params.toObject,
            s = e.split(funnelytics.url.params.regex);
          return t((s = 2 == s.length ? s[1] : null));
        },
        toObject: function (e) {
          var n = {};
          if (e) for (var t, s, i = 0; i < (t = e.split('&')).length; i++) n[(s = t[i].split('='))[0]] = s[1];
          return n;
        },
        toArray: function (e) {
          var n = [];
          if (e)
            for (var t, s, i = e.split('&'), o = 0; o < i.length; o++)
              (s = i[o].indexOf('=') > -1), (t = i[o].split('=')), n.push({ key: t[0], value: t[1], hasEquals: s });
          return n;
        },
        toString: function (e) {
          var n,
            t = '';
          e.length > 0 && (t += '?');
          for (var s = 0; s < e.length; s++) (t += (n = e[s]).key), n.hasEquals && (t += '='), n.value && (t += n.value), s !== e.length - 1 && (t += '&');
          return t;
        },
      },
    },
    events: {
      trigger: function (e, n, t, s) {
        if (!funnelytics.projects.shouldTrackProject()) {
          return;
        }

        var i;
        if ((s || (s = {}), funnelytics.client.isBot())) {
          if (((i = { message: 'No human, no service.' }), 'function' == typeof t)) return void t(i);
          if (!s.promise)
            return Promise
              ? new Promise(function (e, n) {
                  return n(i);
                })
              : void 0;
          s.promise.reject(i);
        }
        if ('string' != typeof e) {
          if (((i = { message: 'First argument must be an event name.' }), 'function' == typeof t)) return void t(i);
          if (!s.promise)
            return Promise
              ? new Promise(function (e, n) {
                  return n(i);
                })
              : void 0;
          s.promise.reject(i);
        }
        if (!funnelytics.step) {
          var o, r;
          if (!t && Promise)
            o = {
              instance: new Promise(function (e, n) {
                r = { resolve: e, reject: n };
              }),
              resolve: r.resolve,
              reject: r.reject,
            };
          return o ? o.instance : void 0;
        }
        if (void 0 !== navigator.sendBeacon && 'function' != typeof t && !s.promise) {
          var u = new Blob(
            [
              'd=' +
                encodeURIComponent(
                  JSON.stringify({ project: funnelytics.project, session: funnelytics.session, step: funnelytics.step, name: e, attributes: n })
                ),
            ],
            { type: 'application/x-www-form-urlencoded' }
          );
          navigator.sendBeacon(funnelytics.origin + '/events/trigger', u);
        } else {
          var c = new XMLHttpRequest();
          c.open('POST', funnelytics.origin + '/events/trigger'),
            c.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'),
            c.addEventListener('load', function () {
              if (((i = JSON.parse(c.responseText)), c.status >= 200 && c.status < 300)) {
                if ('function' == typeof t) t(null, i);
                else if (s.promise) s.promise.resolve(i);
                else if (Promise)
                  return new Promise(function (e, n) {
                    return e(i);
                  });
              } else if ('function' == typeof t) t(i);
              else if (s.promise) s.promise.reject(i);
              else if (Promise)
                return new Promise(function (e, n) {
                  return n(i);
                });
            }),
            c.send(
              'd=' +
                encodeURIComponent(
                  JSON.stringify({ project: funnelytics.project, session: funnelytics.session, step: funnelytics.step, name: e, attributes: n })
                )
            );
        }
      },
    },
    attributes: {
      set: function (e, n) {
        if (!funnelytics.projects.shouldTrackProject()) {
          return;
        }

        var t, s;
        if ('object' != typeof e)
          return (
            (t = { message: 'First argument must be an object containing user details.' }),
            'function' == typeof n
              ? void n(t)
              : Promise
              ? new Promise(function (e, n) {
                  return n(t);
                })
              : void 0
          );
        if (!(s = funnelytics.cookies.get(funnelytics.cookie)))
          return (
            (t = { message: 'No Funnelytics session exists for this user.' }),
            'function' == typeof n
              ? void n(t)
              : Promise
              ? new Promise(function (e, n) {
                  return n(t);
                })
              : void 0
          );
        var i = new XMLHttpRequest();
        i.open('POST', funnelytics.origin + '/trackers/set'),
          i.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'),
          i.addEventListener('load', function () {
            if (((t = JSON.parse(i.responseText)), i.status >= 200 && i.status < 300)) {
              if ('function' == typeof n) n(null, t);
              else if (Promise)
                return new Promise(function (e, n) {
                  return e(t);
                });
            } else if ('function' == typeof n) n(t);
            else if (Promise)
              return new Promise(function (e, n) {
                return n(t);
              });
          }),
          i.send('d=' + encodeURIComponent(JSON.stringify({ project: funnelytics.project, session: s, info: e })));
      },
    },
    functions: {
      getReferrer() {
        const urlParams = funnelytics.url.params.toObject(window.location.search.substr(1));
        if (!urlParams) {
          return document.referrer;
        }

        const referrer = urlParams[funnelytics.refKey];
        if (!referrer) {
          return document.referrer;
        }

        let isURLEncoded = false;
        try {
          isURLEncoded = referrer !== decodeURIComponent(referrer);
        } catch (_err) {
          isURLEncoded = false;
        }

        return isURLEncoded ? decodeURIComponent(referrer) : referrer;
      },
      initialize: function () {
        if (!funnelytics.projects.shouldTrackProject()) {
          return;
        }

        if (!funnelytics.client.isBot()) {
          var e = new XMLHttpRequest();
          e.open('POST', funnelytics.origin + '/sessions'),
            e.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'),
            e.addEventListener('load', function () {
              if (e.status >= 200 && e.status < 300) {
                var n = JSON.parse(e.responseText);
                (funnelytics.session = n.session),
                  funnelytics.cookies.set(funnelytics.cookie, funnelytics.session),
                  funnelytics.functions.step(),
                  funnelytics.projects.addDOMEvents();
              } else 500 == e.status && funnelytics.cookies.remove(funnelytics.cookie);
            });
          var n = {
            project: funnelytics.project,
            page: window.location.href,
            device: window.matchMedia('(pointer:coarse)').matches ? 'mobile' : 'desktop',
          };
          !0 === funnelytics.isSPA && (n.skipStepCreation = !0), e.send('d=' + encodeURIComponent(JSON.stringify(n)));
        }
      },
      step: function () {
        if (!funnelytics.projects.shouldTrackProject()) {
          return;
        }

        if (!funnelytics.client.isBot())
          if (funnelytics.session) {
            var e = funnelytics.functions.getReferrer();
            funnelytics.isSPA && funnelytics.steps.length > 0 && (e = funnelytics.steps[funnelytics.steps.length - 1]),
              funnelytics.steps.push(window.location.href);
            var n = new XMLHttpRequest();
            n.open('POST', funnelytics.origin + '/steps'),
              n.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'),
              n.addEventListener('load', function () {
                if (n.status >= 200 && n.status < 300) {
                  var resData = JSON.parse(n.responseText);
                  funnelytics.step = resData.step;
                  if (resData.session) {
                    funnelytics.session = resData.session;
                    funnelytics.cookies.expire(funnelytics.cookie);
                    funnelytics.cookies.set(funnelytics.cookie, funnelytics.session);
                  }
                }
              }),
              n.send(
                'd=' +
                  encodeURIComponent(JSON.stringify({ project: funnelytics.project, session: funnelytics.session, page: window.location.href, referrer: e }))
              );
          } else funnelytics.functions.initialize();
      },
    },
    init: function (project, isSPA, defferedEvents, enableAutoTracking) {
      funnelytics.isSPA = isSPA || false;
      funnelytics.project = project;
      funnelytics.session = funnelytics.getSession();

      if (window.location.href.indexOf('gtm-msr.appspot.com') !== -1) {
        return;
      }
    
      funnelytics.projects.fetchSettings()
      .catch((err) => {
        if (err.status === 403) {
          funnelytics.projects._settings = {
            tracking: false,
          };
        }
      })
      .finally(() => {
        if (funnelytics.projects.shouldTrackProject()) {
          if (funnelytics.session) {
            funnelytics.functions.step();
            funnelytics.projects.addDOMEvents();
          } else if (funnelytics.project) {
            funnelytics.functions.initialize();
          }
        
          if (window.funnelytics_queued) {
            funnelytics.functions.step();
          }
    
          if (enableAutoTracking) {
            funnelytics.automaticTracking.enable();
          }
        }
      });
    },
  };

  /**
   * ============================================
   * Auto-tracking
   * ============================================
   */
  // generic functions
  const _genericAddElementListener = (selector, eventName, handlerFn) => {
    const elements = document.querySelectorAll(selector);

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      el.addEventListener(eventName, handlerFn);
    }
  };
  const _genericRemoveElementListener = (selector, eventName, handlerFn) => {
    const elements = document.querySelectorAll(selector);

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      el.removeEventListener(eventName, handlerFn);
    }
  };
  const _genericAddDocumentListener = (eventName, handlerFn) => {
    document.addEventListener(eventName, handlerFn);
  };
  const _genericRemoveDocumentListener = (eventName, handlerFn) => {
    document.removeEventListener(eventName, handlerFn);
  };

  // constants
  const _pagePath = document.location.pathname.replace(/\/?(\?|#|$)/, '/$1');
  const _domain = document.location.hostname;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  );
  const scrollTreshholds = [10, 25, 50, 75, 90];
  // map of Object<string, number[]> - thresholds mapping object
  const youtubePercentageTresholds = {};

  // helpers
  const getScrollTreshold = () => {
    const currentTreshhold = Math.round(((window.scrollY + window.innerHeight) / documentHeight) * 100);
    let passedTreshhold = 0;

    for (let i = 0; i < scrollTreshholds.length; i++) {
      if (currentTreshhold >= scrollTreshholds[i]) {
        passedTreshhold = scrollTreshholds[i];
        scrollTreshholds.splice(i, 1);
      }
    }

    return passedTreshhold;
  };
  const removeQueryParams = (url) => {
    if (!url) {
      return url;
    }
    return url.replace(/\?[^#]*/, '');
  };

  // event constants
  const _eventNames = {
    linkClick: 'Link Click',
    buttonClick: 'Button Click',
    scroll: 'Scroll',
  };
  const flButtonClassName = 'flButton';
  const genericButtonClassName = 'btn';
  const _selectors = {
    link: 'a',
    button: `button, .${flButtonClassName}, .${genericButtonClassName}`,
  };

  // event handlers
  const _linkClickHandler = (event) => {
    const linkTag = 'a';
    let targetLink;

    if (event.target.tagName.toLowerCase() === linkTag) {
      targetLink = event.target;
    } else {
      targetLink = event.target.closest(linkTag);
    }

    if (!targetLink) {
      return;
    }

    const classList = targetLink.classList.value;
    const linkId = targetLink.id;

    const attributes = {
      clickURL: removeQueryParams(targetLink.href),
      clickText: targetLink.innerText,
      pagePath: _pagePath,
      domain: _domain,
      classList,
    };

    if (linkId) {
      attributes.elementId = linkId;
    }

    funnelytics.events.trigger(_eventNames.linkClick, attributes);
  };
  const _buttonClickHandler = (event) => {
    const elementTag = 'button';
    let targetElement;

    if (event.target.tagName.toLowerCase() === elementTag || event.target.classList.contains(flButtonClassName)) {
      targetElement = event.target;
    } else {
      targetElement = event.target.closest(elementTag);

      // special case for hanling .flButton elements children
      if (!targetElement) {
        targetElement = event.target.closest(`.${flButtonClassName}`);
      }
    }

    if (!targetElement) {
      return;
    }

    const classList = targetElement.classList.value;
    const buttonId = targetElement.id;

    const attributes = {
      clickText: targetElement.innerText,
      pagePath: _pagePath,
      domain: _domain,
      classList,
    };

    if (buttonId) {
      attributes.elementId = buttonId;
    }

    funnelytics.events.trigger(_eventNames.buttonClick, attributes);
  };
  const _scrollHandler = () => {
    const treshold = getScrollTreshold();

    if (!treshold) {
      return;
    }

    const attributes = {
      scroll: treshold,
      pagePath: _pagePath,
      domain: _domain,
    };

    funnelytics.events.trigger(_eventNames.scroll, attributes);
  };

  const _listenerMappings = [
    {
      eventName: 'click',
      selector: _selectors.link,
      handlerFn: _linkClickHandler,
    },
    {
      eventName: 'auxclick',
      selector: _selectors.link,
      handlerFn: _linkClickHandler,
    },
    {
      eventName: 'click',
      selector: _selectors.button,
      handlerFn: _buttonClickHandler,
    },
    // {
    //   eventName: 'scroll',
    //   selector: null,
    //   handlerFn: _scrollHandler,
    // },
  ];

  // Video events tracking
  function trackVideoEvent(videoPlatform, videoAction, videoName) {
    funnelytics.events.trigger('Video View', {
      videoPlatform,
      videoAction,
      videoName,
      pagePath: _pagePath,
      domain: _domain,
    });
  }

  function setupPercentageTracking(videoTitle, videoPlatform) {
    let milestones = [10, 25, 50, 75, 90, 100];

    return function (currentTime, duration) {
      const percent = (currentTime / duration) * 100;
      for (let i = 0; i < milestones.length; i++) {
        if (percent >= milestones[i]) {
          trackVideoEvent(videoPlatform, `${milestones[i]}%`, videoTitle);
          milestones.splice(i, 1);
          i--;
        }
      }
    };
  }

  function setupPercentageTrackingForYoutube(videoId) {
    const videoPlatform = 'YouTube';
    let milestones = youtubePercentageTresholds[videoId];

    return function (currentTime, duration, videoTitle) {
      const percent = (currentTime / duration) * 100;
      for (let i = 0; i < milestones.length; i++) {
        if (percent >= milestones[i]) {
          trackVideoEvent(videoPlatform, `${milestones[i]}%`, videoTitle);
          milestones.splice(i, 1);
          i--;
        }
      }
    };
  }

  function loadScript(url, callback) {
    const firstScript = document.getElementsByTagName('script')[0];
    const script = document.createElement('script');
    script.src = url;
    script.onload = callCallback;
    script.async = true;

    firstScript.parentNode.insertBefore(script, firstScript);

    function callCallback() {
      if (callback) {
        callback();
        script.onload = null;
      }
    }
  }

  // YouTube
  function loadYouTubeTracking() {
    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
      loadScript('https://www.youtube.com/iframe_api');
    } else {
      onYouTubeIframeAPIReady();
    }
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // Convert to 32bit integer
    }
    return new Uint32Array([hash])[0].toString(36);
  };

  let youtubeWasLoaded = false;
  function onYouTubeIframeAPIReady() {
    if (youtubeWasLoaded) {
      return;
    }

    youtubeWasLoaded = true;
    const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"]');
    youtubeIframes.forEach((iframe) => {
      
      if (!iframe.id) {
        // create unique id
        iframe.id = simpleHash(Date.now().toString());
      }

      youtubePercentageTresholds[iframe.id] = [10, 25, 50, 75, 90, 100];

      const src = iframe.getAttribute('src');
      if (src.indexOf('enablejsapi') === -1) {
        const playerUrl = new URL(src);
        playerUrl.searchParams.append("enablejsapi", "1");
        iframe.setAttribute("src", playerUrl.toString());
      }

      new YT.Player(`${iframe.id}` , {
        events: {
          'onReady': onPlayerReady,
        },
      });

    });
  }

  function onPlayerReady(event) {
    event.target.addEventListener('onStateChange', function(event) {
        const trackPercentFunc = setupPercentageTrackingForYoutube(event.target.getIframe().id);
        onPlayerStateChange(event, trackPercentFunc);
    });
  }

  function onPlayerStateChange(event, trackPercentFunc) {
    const title = event.target.getVideoData().title;

    if (event.data === YT.PlayerState.PLAYING) {
      trackVideoEvent('YouTube', 'play', title);
    } else if (event.data === YT.PlayerState.PAUSED) {
      trackVideoEvent('YouTube', 'pause', title);
    }

    trackPercentFunc(event.target.getCurrentTime(), event.target.getDuration(), title);
  }

  // Youtube requires this function to be global
  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

  // Vimeo
  function loadVimeoTracking() {
    if (typeof Vimeo === 'undefined' || typeof Vimeo.Player === 'undefined') {
      loadScript('https://player.vimeo.com/api/player.js', setupVimeoVideos);
    } else {
      setupVimeoVideos();
    }
  }

  function setupVimeoVideos() {
    const vimeoIframes = document.querySelectorAll('iframe[src*="vimeo.com"]');
    vimeoIframes.forEach((iframe) => {
      const player = new Vimeo.Player(iframe);

      player.getVideoTitle().then((title) => {
        const trackPercent = setupPercentageTracking(title, 'Vimeo');

        player.on('play', function () {
          trackVideoEvent('Vimeo', 'play', title);
        });

        player.on('pause', function () {
          trackVideoEvent('Vimeo', 'pause', title);
        });

        player.on('timeupdate', function (data) {
          trackPercent(data.seconds, data.duration);
        });
      });
    });
  }

  // Wistia
  function loadWistiaTracking() {
    if (typeof Wistia === 'undefined') {
      loadScript('fast.wistia.net/assets/external/E-v1.js', setupWistiaTracking);
    } else {
      setupWistiaTracking();
    }
  }

  function setupWistiaTracking() {
    window._wq = window._wq || [];
    _wq.push({
      id: '_all',
      onReady: function (video) {
        const videoTitle = video.name();
        const trackPercent = setupPercentageTracking(videoTitle, 'Wistia');

        video.bind('secondchange', function (s) {
          trackPercent(s, video.duration());
        });

        video.bind('play', function () {
          trackVideoEvent('Wistia', 'play', videoTitle);
        });

        video.bind('pause', function () {
          trackVideoEvent('Wistia', 'pause', videoTitle);
        });
      },
    });
  }

  // Generic HTML5
  function setupHTML5VideoTracking() {
    const html5Videos = document.querySelectorAll('video');
    html5Videos.forEach((video) => {
      const videoTitle = video.getAttribute('title') || 'Unnamed Video';
      const trackPercent = setupPercentageTracking(videoTitle, 'HTML5');

      video.addEventListener('timeupdate', function () {
        trackPercent(video.currentTime, video.duration);
      });

      video.addEventListener('play', function () {
        trackVideoEvent('HTML5', 'play', videoTitle);
      });

      video.addEventListener('pause', function () {
        trackVideoEvent('HTML5', 'pause', videoTitle);
      });
    });
  }

  // Initializer
  function detectAndInitVideoTracking() {
    if (document.querySelector('iframe[src*="youtube.com"]')) loadYouTubeTracking();
    if (document.querySelector('iframe[src*="vimeo.com"]')) loadVimeoTracking();
    if (document.querySelector('.wistia_embed')) loadWistiaTracking();
    if (document.querySelector('video')) setupHTML5VideoTracking();
  }

  funnelytics.automaticTracking = {
    enable: function () {
      const mappings = Object.values(_listenerMappings);
      for (let i = 0; i < mappings.length; i++) {
        const mappingObj = mappings[i];

        if (mappingObj.selector) {
          _genericAddElementListener(mappingObj.selector, mappingObj.eventName, mappingObj.handlerFn);
        } else {
          _genericAddDocumentListener(mappingObj.eventName, mappingObj.handlerFn);
        }
      }

      // Launch the detection and initialization of video tracking
      detectAndInitVideoTracking();
    },
    disable: function () {
      const mappings = Object.values(_listenerMappings);
      for (let i = 0; i < mappings.length; i++) {
        const mappingObj = mappings[i];
        if (mappingObj.selector) {
          _genericRemoveElementListener(mappingObj.selector, mappingObj.eventName, mappingObj.handlerFn);
        } else {
          _genericRemoveDocumentListener(mappingObj.eventName, mappingObj.handlerFn);
        }
      }
    },
  };

  window.funnelytics = funnelytics;
})();
