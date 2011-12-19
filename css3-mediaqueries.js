if(typeof Object.create !== "function") {
  Object.create = function(o) {
    function F() {
    }
    F.prototype = o;
    return new F
  }
}
var ua = {toString:function() {
  return navigator.userAgent
}, test:function(s) {
  return this.toString().toLowerCase().indexOf(s.toLowerCase()) > -1
}};
ua.version = (ua.toString().toLowerCase().match(/[\s\S]+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [])[1];
ua.webkit = ua.test("webkit");
ua.gecko = ua.test("gecko") && !ua.webkit;
ua.opera = ua.test("opera");
ua.ie = ua.test("msie") && !ua.opera;
ua.ie6 = ua.ie && document.compatMode && typeof document.documentElement.style.maxHeight === "undefined";
ua.ie7 = ua.ie && document.documentElement && typeof document.documentElement.style.maxHeight !== "undefined" && typeof XDomainRequest === "undefined";
ua.ie8 = ua.ie && typeof XDomainRequest !== "undefined";
var domReady = function() {
  var fns = [];
  var init = function() {
    if(!arguments.callee.done) {
      arguments.callee.done = true;
      for(var i = 0;i < fns.length;i++) {
        fns[i]()
      }
    }
  };
  if(document.addEventListener) {
    document.addEventListener("DOMContentLoaded", init, false)
  }
  if(ua.ie) {
    (function() {
      try {
        document.documentElement.doScroll("left")
      }catch(e) {
        setTimeout(arguments.callee, 50);
        return
      }
      init()
    })();
    document.onreadystatechange = function() {
      if(document.readyState === "complete") {
        document.onreadystatechange = null;
        init()
      }
    }
  }
  if(ua.webkit && document.readyState) {
    (function() {
      if(document.readyState !== "loading") {
        init()
      }else {
        setTimeout(arguments.callee, 10)
      }
    })()
  }
  window.onload = init;
  return function(fn) {
    if(typeof fn === "function") {
      fns[fns.length] = fn
    }
    return fn
  }
}();
var cssHelper = function() {
  var regExp = {BLOCKS:/[^\s{][^{]*\{(?:[^{}]*\{[^{}]*\}[^{}]*|[^{}]*)*\}/g, BLOCKS_INSIDE:/[^\s{][^{]*\{[^{}]*\}/g, DECLARATIONS:/[a-zA-Z\-]+[^;]*:[^;]+;/g, RELATIVE_URLS:/url\(['"]?([^\/\)'"][^:\)'"]+)['"]?\)/g, REDUNDANT_COMPONENTS:/(?:\/\*([^*\\\\]|\*(?!\/))+\*\/|@import[^;]+;)/g, REDUNDANT_WHITESPACE:/\s*(,|:|;|\{|\})\s*/g, MORE_WHITESPACE:/\s{2,}/g, FINAL_SEMICOLONS:/;\}/g, NOT_WHITESPACE:/\S+/g};
  var parsed, parsing = false;
  var waiting = [];
  var wait = function(fn) {
    if(typeof fn === "function") {
      waiting[waiting.length] = fn
    }
  };
  var ready = function() {
    for(var i = 0;i < waiting.length;i++) {
      waiting[i](parsed)
    }
  };
  var events = {};
  var broadcast = function(n, v) {
    if(events[n]) {
      var listeners = events[n].listeners;
      if(listeners) {
        for(var i = 0;i < listeners.length;i++) {
          listeners[i](v)
        }
      }
    }
  };
  var requestText = function(url, fnSuccess, fnFailure) {
    if(ua.ie && !window.XMLHttpRequest) {
      window.XMLHttpRequest = function() {
        return new ActiveXObject("Microsoft.XMLHTTP")
      }
    }
    if(!XMLHttpRequest) {
      return""
    }
    var r = new XMLHttpRequest;
    try {
      r.open("get", url, true);
      r.setRequestHeader("X_REQUESTED_WITH", "XMLHttpRequest")
    }catch(e) {
      fnFailure();
      return
    }
    var done = false;
    setTimeout(function() {
      done = true
    }, 5E3);
    document.documentElement.style.cursor = "progress";
    r.onreadystatechange = function() {
      if(r.readyState === 4 && !done) {
        if(!r.status && location.protocol === "file:" || r.status >= 200 && r.status < 300 || r.status === 304 || navigator.userAgent.indexOf("Safari") > -1 && typeof r.status === "undefined") {
          fnSuccess(r.responseText)
        }else {
          fnFailure()
        }
        document.documentElement.style.cursor = "";
        r = null
      }
    };
    r.send("")
  };
  var sanitize = function(text) {
    text = text.replace(regExp.REDUNDANT_COMPONENTS, "");
    text = text.replace(regExp.REDUNDANT_WHITESPACE, "$1");
    text = text.replace(regExp.MORE_WHITESPACE, " ");
    text = text.replace(regExp.FINAL_SEMICOLONS, "}");
    return text
  };
  var objects = {mediaQueryList:function(s) {
    var o = {};
    var idx = s.indexOf("{");
    var lt = s.substring(0, idx);
    s = s.substring(idx + 1, s.length - 1);
    var mqs = [], rs = [];
    var qts = lt.toLowerCase().substring(7).split(",");
    for(var i = 0;i < qts.length;i++) {
      mqs[mqs.length] = objects.mediaQuery(qts[i], o)
    }
    var rts = s.match(regExp.BLOCKS_INSIDE);
    if(rts !== null) {
      for(i = 0;i < rts.length;i++) {
        rs[rs.length] = objects.rule(rts[i], o)
      }
    }
    o.getMediaQueries = function() {
      return mqs
    };
    o.getRules = function() {
      return rs
    };
    o.getListText = function() {
      return lt
    };
    o.getCssText = function() {
      return s
    };
    return o
  }, mediaQuery:function(s, mql) {
    s = s || "";
    var not = false, type;
    var exp = [];
    var valid = true;
    var tokens = s.match(regExp.NOT_WHITESPACE);
    for(var i = 0;i < tokens.length;i++) {
      var token = tokens[i];
      if(!type && (token === "not" || token === "only")) {
        if(token === "not") {
          not = true
        }
      }else {
        if(!type) {
          type = token
        }else {
          if(token.charAt(0) === "(") {
            var pair = token.substring(1, token.length - 1).split(":");
            exp[exp.length] = {mediaFeature:pair[0], value:pair[1] || null}
          }
        }
      }
    }
    return{getList:function() {
      return mql || null
    }, getValid:function() {
      return valid
    }, getNot:function() {
      return not
    }, getMediaType:function() {
      return type
    }, getExpressions:function() {
      return exp
    }}
  }, rule:function(s, mql) {
    var o = {};
    var idx = s.indexOf("{");
    var st = s.substring(0, idx);
    var ss = st.split(",");
    var ds = [];
    var dts = s.substring(idx + 1, s.length - 1).split(";");
    for(var i = 0;i < dts.length;i++) {
      ds[ds.length] = objects.declaration(dts[i], o)
    }
    o.getMediaQueryList = function() {
      return mql || null
    };
    o.getSelectors = function() {
      return ss
    };
    o.getSelectorText = function() {
      return st
    };
    o.getDeclarations = function() {
      return ds
    };
    o.getPropertyValue = function(n) {
      for(var i = 0;i < ds.length;i++) {
        if(ds[i].getProperty() === n) {
          return ds[i].getValue()
        }
      }
      return null
    };
    return o
  }, declaration:function(s, r) {
    var idx = s.indexOf(":");
    var p = s.substring(0, idx);
    var v = s.substring(idx + 1);
    return{getRule:function() {
      return r || null
    }, getProperty:function() {
      return p
    }, getValue:function() {
      return v
    }}
  }};
  var parseText = function(el) {
    if(typeof el.cssHelperText !== "string") {
      return
    }
    var o = {mediaQueryLists:[], rules:[], selectors:{}, declarations:[], properties:{}};
    var mqls = o.mediaQueryLists;
    var ors = o.rules;
    var blocks = el.cssHelperText.match(regExp.BLOCKS);
    if(blocks !== null) {
      for(var i = 0;i < blocks.length;i++) {
        if(blocks[i].substring(0, 7) === "@media ") {
          mqls[mqls.length] = objects.mediaQueryList(blocks[i]);
          ors = o.rules = ors.concat(mqls[mqls.length - 1].getRules())
        }else {
          ors[ors.length] = objects.rule(blocks[i])
        }
      }
    }
    var oss = o.selectors;
    var collectSelectors = function(r) {
      var ss = r.getSelectors();
      for(var i = 0;i < ss.length;i++) {
        var n = ss[i];
        if(!oss[n]) {
          oss[n] = []
        }
        oss[n][oss[n].length] = r
      }
    };
    for(i = 0;i < ors.length;i++) {
      collectSelectors(ors[i])
    }
    var ods = o.declarations;
    for(i = 0;i < ors.length;i++) {
      ods = o.declarations = ods.concat(ors[i].getDeclarations())
    }
    var ops = o.properties;
    for(i = 0;i < ods.length;i++) {
      var n = ods[i].getProperty();
      if(!ops[n]) {
        ops[n] = []
      }
      ops[n][ops[n].length] = ods[i]
    }
    el.cssHelperParsed = o;
    parsed[parsed.length] = el;
    return o
  };
  var parseEmbedded = function(el, s) {
    el.cssHelperText = sanitize(s || el.innerHTML);
    return parseText(el)
  };
  var parse = function() {
    parsing = true;
    parsed = [];
    var linked = [];
    var finish = function() {
      for(var i = 0;i < linked.length;i++) {
        parseText(linked[i])
      }
      var styles = document.getElementsByTagName("style");
      for(i = 0;i < styles.length;i++) {
        parseEmbedded(styles[i])
      }
      parsing = false;
      ready()
    };
    var links = document.getElementsByTagName("link");
    for(var i = 0;i < links.length;i++) {
      var link = links[i];
      if(link.getAttribute("rel").indexOf("style") > -1 && link.href && link.href.length !== 0 && !link.disabled) {
        linked[linked.length] = link
      }
    }
    if(linked.length > 0) {
      var c = 0;
      var checkForFinish = function() {
        c++;
        if(c === linked.length) {
          finish()
        }
      };
      var processLink = function(link) {
        var href = link.href;
        requestText(href, function(text) {
          text = sanitize(text).replace(regExp.RELATIVE_URLS, "url(" + href.substring(0, href.lastIndexOf("/")) + "/$1)");
          link.cssHelperText = text;
          checkForFinish()
        }, checkForFinish)
      };
      for(i = 0;i < linked.length;i++) {
        processLink(linked[i])
      }
    }else {
      finish()
    }
  };
  var types = {mediaQueryLists:"array", rules:"array", selectors:"object", declarations:"array", properties:"object"};
  var collections = {mediaQueryLists:null, rules:null, selectors:null, declarations:null, properties:null};
  var addToCollection = function(name, v) {
    if(collections[name] !== null) {
      if(types[name] === "array") {
        return collections[name] = collections[name].concat(v)
      }else {
        var c = collections[name];
        for(var n in v) {
          if(v.hasOwnProperty(n)) {
            if(!c[n]) {
              c[n] = v[n]
            }else {
              c[n] = c[n].concat(v[n])
            }
          }
        }
        return c
      }
    }
  };
  var collect = function(name) {
    collections[name] = types[name] === "array" ? [] : {};
    for(var i = 0;i < parsed.length;i++) {
      addToCollection(name, parsed[i].cssHelperParsed[name])
    }
    return collections[name]
  };
  domReady(function() {
    var els = document.body.getElementsByTagName("*");
    for(var i = 0;i < els.length;i++) {
      els[i].checkedByCssHelper = true
    }
    if(document.implementation.hasFeature("MutationEvents", "2.0") || window.MutationEvent) {
      document.body.addEventListener("DOMNodeInserted", function(e) {
        var el = e.target;
        if(el.nodeType === 1) {
          broadcast("DOMElementInserted", el);
          el.checkedByCssHelper = true
        }
      }, false)
    }else {
      setInterval(function() {
        var els = document.body.getElementsByTagName("*");
        for(var i = 0;i < els.length;i++) {
          if(!els[i].checkedByCssHelper) {
            broadcast("DOMElementInserted", els[i]);
            els[i].checkedByCssHelper = true
          }
        }
      }, 1E3)
    }
  });
  var getViewportSize = function(d) {
    if(typeof window.innerWidth != "undefined") {
      return window["inner" + d]
    }else {
      if(typeof document.documentElement != "undefined" && typeof document.documentElement.clientWidth != "undefined" && document.documentElement.clientWidth != 0) {
        return document.documentElement["client" + d]
      }
    }
  };
  return{addStyle:function(s, process) {
    var el = document.createElement("style");
    el.setAttribute("type", "text/css");
    document.getElementsByTagName("head")[0].appendChild(el);
    if(el.styleSheet) {
      el.styleSheet.cssText = s
    }else {
      el.appendChild(document.createTextNode(s))
    }
    el.addedWithCssHelper = true;
    if(typeof process === "undefined" || process === true) {
      cssHelper.parsed(function(parsed) {
        var o = parseEmbedded(el, s);
        for(var n in o) {
          if(o.hasOwnProperty(n)) {
            addToCollection(n, o[n])
          }
        }
        broadcast("newStyleParsed", el)
      })
    }else {
      el.parsingDisallowed = true
    }
    return el
  }, removeStyle:function(el) {
    return el.parentNode.removeChild(el)
  }, parsed:function(fn) {
    if(parsing) {
      wait(fn)
    }else {
      if(typeof parsed !== "undefined") {
        if(typeof fn === "function") {
          fn(parsed)
        }
      }else {
        wait(fn);
        parse()
      }
    }
  }, mediaQueryLists:function(fn) {
    cssHelper.parsed(function(parsed) {
      fn(collections.mediaQueryLists || collect("mediaQueryLists"))
    })
  }, rules:function(fn) {
    cssHelper.parsed(function(parsed) {
      fn(collections.rules || collect("rules"))
    })
  }, selectors:function(fn) {
    cssHelper.parsed(function(parsed) {
      fn(collections.selectors || collect("selectors"))
    })
  }, declarations:function(fn) {
    cssHelper.parsed(function(parsed) {
      fn(collections.declarations || collect("declarations"))
    })
  }, properties:function(fn) {
    cssHelper.parsed(function(parsed) {
      fn(collections.properties || collect("properties"))
    })
  }, broadcast:broadcast, addListener:function(n, fn) {
    if(typeof fn === "function") {
      if(!events[n]) {
        events[n] = {listeners:[]}
      }
      events[n].listeners[events[n].listeners.length] = fn
    }
  }, removeListener:function(n, fn) {
    if(typeof fn === "function" && events[n]) {
      var ls = events[n].listeners;
      for(var i = 0;i < ls.length;i++) {
        if(ls[i] === fn) {
          ls.splice(i, 1);
          i -= 1
        }
      }
    }
  }, getViewportWidth:function() {
    return getViewportSize("Width")
  }, getViewportHeight:function() {
    return getViewportSize("Height")
  }}
}();
domReady(function enableCssMediaQueries() {
  var meter;
  var regExp = {LENGTH_UNIT:/[0-9]+(em|ex|px|in|cm|mm|pt|pc)$/, RESOLUTION_UNIT:/[0-9]+(dpi|dpcm)$/, ASPECT_RATIO:/^[0-9]+\/[0-9]+$/, ABSOLUTE_VALUE:/^[0-9]*(\.[0-9]+)*$/};
  var styles = [];
  var nativeSupport = function() {
    var id = "css3-mediaqueries-test";
    var el = document.createElement("div");
    el.id = id;
    var style = cssHelper.addStyle("@media all and (width) { #" + id + " { width: 1px !important; } }", false);
    document.body.appendChild(el);
    var ret = el.offsetWidth === 1;
    style.parentNode.removeChild(style);
    el.parentNode.removeChild(el);
    nativeSupport = function() {
      return ret
    };
    return ret
  };
  var createMeter = function() {
    meter = document.createElement("div");
    meter.style.cssText = "position:absolute;top:-9999em;left:-9999em;" + "margin:0;border:none;padding:0;width:1em;font-size:1em;";
    document.body.appendChild(meter);
    if(meter.offsetWidth !== 16) {
      meter.style.fontSize = 16 / meter.offsetWidth + "em"
    }
    meter.style.width = ""
  };
  var measure = function(value) {
    meter.style.width = value;
    var amount = meter.offsetWidth;
    meter.style.width = "";
    return amount
  };
  var testMediaFeature = function(feature, value) {
    var l = feature.length;
    var min = feature.substring(0, 4) === "min-";
    var max = !min && feature.substring(0, 4) === "max-";
    if(value !== null) {
      var valueType;
      var amount;
      if(regExp.LENGTH_UNIT.exec(value)) {
        valueType = "length";
        amount = measure(value)
      }else {
        if(regExp.RESOLUTION_UNIT.exec(value)) {
          valueType = "resolution";
          amount = parseInt(value, 10);
          var unit = value.substring((amount + "").length)
        }else {
          if(regExp.ASPECT_RATIO.exec(value)) {
            valueType = "aspect-ratio";
            amount = value.split("/")
          }else {
            if(regExp.ABSOLUTE_VALUE) {
              valueType = "absolute";
              amount = value
            }else {
              valueType = "unknown"
            }
          }
        }
      }
    }
    var width, height;
    if("device-width" === feature.substring(l - 12, l)) {
      width = screen.width;
      if(value !== null) {
        if(valueType === "length") {
          return min && width >= amount || max && width < amount || !min && !max && width === amount
        }else {
          return false
        }
      }else {
        return width > 0
      }
    }else {
      if("device-height" === feature.substring(l - 13, l)) {
        height = screen.height;
        if(value !== null) {
          if(valueType === "length") {
            return min && height >= amount || max && height < amount || !min && !max && height === amount
          }else {
            return false
          }
        }else {
          return height > 0
        }
      }else {
        if("width" === feature.substring(l - 5, l)) {
          width = document.documentElement.clientWidth || document.body.clientWidth;
          if(value !== null) {
            if(valueType === "length") {
              return min && width >= amount || max && width < amount || !min && !max && width === amount
            }else {
              return false
            }
          }else {
            return width > 0
          }
        }else {
          if("height" === feature.substring(l - 6, l)) {
            height = document.documentElement.clientHeight || document.body.clientHeight;
            if(value !== null) {
              if(valueType === "length") {
                return min && height >= amount || max && height < amount || !min && !max && height === amount
              }else {
                return false
              }
            }else {
              return height > 0
            }
          }else {
            if("orientation" === feature.substring(l - 11, l)) {
              width = document.documentElement.clientWidth || document.body.clientWidth;
              height = document.documentElement.clientHeight || document.body.clientHeight;
              if(valueType === "absolute") {
                return amount === "portrait" ? width <= height : width > height
              }else {
                return false
              }
            }else {
              if("aspect-ratio" === feature.substring(l - 12, l)) {
                width = document.documentElement.clientWidth || document.body.clientWidth;
                height = document.documentElement.clientHeight || document.body.clientHeight;
                var curRatio = width / height;
                var ratio = amount[1] / amount[0];
                if(valueType === "aspect-ratio") {
                  return min && curRatio >= ratio || max && curRatio < ratio || !min && !max && curRatio === ratio
                }else {
                  return false
                }
              }else {
                if("device-aspect-ratio" === feature.substring(l - 19, l)) {
                  return valueType === "aspect-ratio" && screen.width * amount[1] === screen.height * amount[0]
                }else {
                  if("color-index" === feature.substring(l - 11, l)) {
                    var colors = Math.pow(2, screen.colorDepth);
                    if(value !== null) {
                      if(valueType === "absolute") {
                        return min && colors >= amount || max && colors < amount || !min && !max && colors === amount
                      }else {
                        return false
                      }
                    }else {
                      return colors > 0
                    }
                  }else {
                    if("color" === feature.substring(l - 5, l)) {
                      var color = screen.colorDepth;
                      if(value !== null) {
                        if(valueType === "absolute") {
                          return min && color >= amount || max && color < amount || !min && !max && color === amount
                        }else {
                          return false
                        }
                      }else {
                        return color > 0
                      }
                    }else {
                      if("resolution" === feature.substring(l - 10, l)) {
                        var res;
                        if(unit === "dpcm") {
                          res = measure("1cm")
                        }else {
                          res = measure("1in")
                        }
                        if(value !== null) {
                          if(valueType === "resolution") {
                            return min && res >= amount || max && res < amount || !min && !max && res === amount
                          }else {
                            return false
                          }
                        }else {
                          return res > 0
                        }
                      }else {
                        return false
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  var testMediaQuery = function(mq) {
    var test = mq.getValid();
    var expressions = mq.getExpressions();
    var l = expressions.length;
    if(l > 0) {
      for(var i = 0;i < l && test;i++) {
        test = testMediaFeature(expressions[i].mediaFeature, expressions[i].value)
      }
      var not = mq.getNot();
      return test && !not || not && !test
    }
  };
  var testMediaQueryList = function(mql) {
    var mqs = mql.getMediaQueries();
    var t = {};
    for(var i = 0;i < mqs.length;i++) {
      if(testMediaQuery(mqs[i])) {
        t[mqs[i].getMediaType()] = true
      }
    }
    var s = [], c = 0;
    for(var n in t) {
      if(t.hasOwnProperty(n)) {
        if(c > 0) {
          s[c++] = ","
        }
        s[c++] = n
      }
    }
    if(s.length > 0) {
      styles[styles.length] = cssHelper.addStyle("@media " + s.join("") + "{" + mql.getCssText() + "}", false)
    }
  };
  var testMediaQueryLists = function(mqls) {
    for(var i = 0;i < mqls.length;i++) {
      testMediaQueryList(mqls[i])
    }
    if(ua.ie) {
      document.documentElement.style.display = "block";
      setTimeout(function() {
        document.documentElement.style.display = ""
      }, 0);
      setTimeout(function() {
        cssHelper.broadcast("cssMediaQueriesTested")
      }, 100)
    }else {
      cssHelper.broadcast("cssMediaQueriesTested")
    }
  };
  var test = function() {
    for(var i = 0;i < styles.length;i++) {
      cssHelper.removeStyle(styles[i])
    }
    styles = [];
    cssHelper.mediaQueryLists(testMediaQueryLists)
  };
  var scrollbarWidth = 0;
  var checkForResize = function() {
    var cvpw = cssHelper.getViewportWidth();
    var cvph = cssHelper.getViewportHeight();
    if(ua.ie) {
      var el = document.createElement("div");
      el.style.position = "absolute";
      el.style.top = "-9999em";
      el.style.overflow = "scroll";
      document.body.appendChild(el);
      scrollbarWidth = el.offsetWidth - el.clientWidth;
      document.body.removeChild(el)
    }
    var timer;
    var resizeHandler = function() {
      var vpw = cssHelper.getViewportWidth();
      var vph = cssHelper.getViewportHeight();
      if(Math.abs(vpw - cvpw) > scrollbarWidth || Math.abs(vph - cvph) > scrollbarWidth) {
        cvpw = vpw;
        cvph = vph;
        clearTimeout(timer);
        timer = setTimeout(function() {
          if(!nativeSupport()) {
            test()
          }else {
            cssHelper.broadcast("cssMediaQueriesTested")
          }
        }, 500)
      }
    };
    window.onresize = function() {
      var x = window.onresize || function() {
      };
      return function() {
        x();
        resizeHandler()
      }
    }()
  };
  var docEl = document.documentElement;
  docEl.style.marginLeft = "-32767px";
  setTimeout(function() {
    docEl.style.marginTop = ""
  }, 2E4);
  return function() {
    if(!nativeSupport()) {
      cssHelper.addListener("newStyleParsed", function(el) {
        testMediaQueryLists(el.cssHelperParsed.mediaQueryLists)
      });
      cssHelper.addListener("cssMediaQueriesTested", function() {
        if(ua.ie) {
          docEl.style.width = "1px"
        }
        setTimeout(function() {
          docEl.style.width = "";
          docEl.style.marginLeft = ""
        }, 0);
        cssHelper.removeListener("cssMediaQueriesTested", arguments.callee)
      });
      createMeter();
      test()
    }else {
      docEl.style.marginLeft = ""
    }
    checkForResize()
  }
}());
try {
  document.execCommand("BackgroundImageCache", false, true)
}catch(e) {
}
;