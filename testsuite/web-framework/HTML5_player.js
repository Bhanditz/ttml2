/*
 * Based on jQuery srt
   http://v2v.cc/~j/jquery.srt/

  usage:
    <video src="example.movie" id="video" controls>
      <text lang='en' type="application/ttaf+xml" src="testsuite/Content/Br001.xml"></text>
    </video>

  license:
    You can do whatever you want with this code, except for the playSRT function
    See the jQuery srt license for playSRT function at
      http://v2v.cc/~j/jquery.srt/
*/

if (typeof XMLHttpRequest == "undefined" ) {
    // Provide the XMLHttpRequest class for IE 5.x-6.x:
    XMLHttpRequest = function() {
	try { return new ActiveXObject("Microsoft.XMLHTTP") } catch(e) {}
	try { return new ActiveXObject("Msxml2.XMLHTTP.6.0") } catch(e) {}
	try { return new ActiveXObject("Msxml2.XMLHTTP.3.0") } catch(e) {}
	try { return new ActiveXObject("Msxml2.XMLHTTP") } catch(e) {}
	throw new Error( "This browser does not support XMLHttpRequest." )
    };
}

var DFXP_NS = "http://www.w3.org/2006/10/ttaf1";
var XHTML_NS = "http://www.w3.org/1999/xhtml";
var DFXP_NS_Parameter = "http://www.w3.org/2006/10/ttaf1#parameter";
var DFXP_NS_Style = "http://www.w3.org/2006/10/ttaf1#styling";
var DFXP_NS_Style_Extensions = "http://www.w3.org/2006/10/ttaf1#style-extension";
var DFXP_NS_Metadata = "http://www.w3.org/2006/10/ttaf1#metadata";
var DFXP_NS_Metadata_Extensions = "http://www.w3.org/2006/10/ttaf1#metadata-extension";

var DFXP_TIME_CONTAINER_PAR = 1;
var DFXP_TIME_CONTAINER_SEQ = 2;

var HTML5Caption_debug = false;

HTML5Caption_toSeconds = function(t) {
    var s = 0.0;
    if (t) {
	var p = t.split(':');
	
	switch (p.length) {
	case 0:
	case 1:
	case 2:
	    break;
	case 3:
	    for (var i=0; i < 3; i++)
		s = s * 60 + parseFloat(p[i].replace(',', '.'));
	    break;
	case 4:
	    for (var i=0; i < 3; i++)
		s = s * 60 + parseFloat(p[i].replace(',', '.'));
	    // @@ ignore frames
	    break;
	}
    }
    return s;
}
    
HTML5Caption_strip = function(s) {
   return s.replace(/^\s+|\s+$/g,"");
}

HTML5Caption_playSRT = function(video, srt) {    

    srt = srt.replace('\r\n|\r|\n', '\n');
	
    var subtitles = {};
    srt = HTML5Caption_strip(srt);
    var srt_ = srt.split('\n\n');
    for(s in srt_) {
	st = srt_[s].split('\n');
	if(st.length >=2) {
	    n = st[0];
	    i = strip(st[1].split(' --> ')[0]);
	    o = strip(st[1].split(' --> ')[1]);
	    t = st[2];
	    if(st.length > 2) {
		for(j=3; j<st.length;j++)
		    t += '\n'+st[j];
	    }
	    is = HTML5Caption_toSeconds(i);
	    os = HTML5Caption_toSeconds(o);
	    subtitles[is] = {i:is, o: os, t: t};
	}
    }
    var currentSubtitle = -1;

    // create the subtitle area
    var div = document.createElement("div");
    div.className = 'srt';
    video.parentNode.insertBefore(div, video.nextSibling);

    var currentTime = video.currentTime;

    if (typeof currentTime == "undefined") {
	throw new Error("currentTime is not supported by the Video element");
    } else {
	var ival = setInterval(function() {
		var currentTime = video.currentTime;
		var subtitle = -1;
		for (s in subtitles) {
		    if (s > currentTime)
			break;
		    subtitle = s;
		}
		if (subtitle != -1) {
		    if (subtitle != currentSubtitle) {
			div.innerHTML = subtitles[subtitle].t;
			currentSubtitle=subtitle;
		    } else if (subtitles[subtitle].o < currentTime) {
			div.innerHTML = '';
		    }
		}
	    }, 100);
    }
}

HTML5Caption_convertDFXP2HTMLAttributes = function(dfxpElement, htmlElement) {
    var v;
    
    // that's a little extension of my own to support the style
    // attribute like (x)HTML
    v = dfxpElement.getAttributeNS(XHTML_NS, "style");
    if (v != "") {
	htmlElement.style.cssText = v;
    }


    v = dfxpElement.getAttribute("style");

    if (v != null && v != "") {
	var p = v.split(' ');
	switch (p.length) {
	case 1:
	    var dfxpElementRef = dfxpElement.ownerDocument.getElementById(v);
	    
	    if (dfxpElementRef == null) {
		// getElementById doesn't work, let's try something else
		var styles = dfxpElement.ownerDocument.getElementsByTagNameNS(DFXP_NS, "style");

		for (var i = 0; i < styles.length; i++) {
		    var s = styles.item(i);
		    var id = s.getAttribute("xml:id");
		    if (id == v) {
			dfxpElementRef = s;
			break;
		    }
		}
	    }
	    break;
	default:
	    if (HTML5Caption_debug) alert("@@TODO IDREFS");
	}
	if (dfxpElementRef != null) {
	    HTML5Caption_convertDFXP2HTMLAttributes(dfxpElementRef, htmlElement);	    
	} else {
	    if (HTML5Caption_debug) alert("can't find " + v);
	}
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "backgroundColor");
    if (v != "") {
	htmlElement.style.setProperty("background-color", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "color");
    if (v != "") {
	htmlElement.style.setProperty("color", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "direction");
    if (v != "") {
	htmlElement.style.setProperty("direction", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "display");
    if ((v == "") || (v == "auto")) {
	if (htmlElement.localName == "span") {
	    v = "inline";
	} else {
	    v = "block";
	}
    }
    htmlElement.style.setProperty("display", v, "");
    htmlElement.df_displayValue = v;

    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "fontFamily");
    if (v != "") {
	htmlElement.style.setProperty("font-family", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "fontSize");
    if (v != "") {
	htmlElement.style.setProperty("font-size", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "fontStyle");
    if (v != "") {
	htmlElement.style.setProperty("font-style", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "fontWeight");
    if (v != "") {
	htmlElement.style.setProperty("font-weight", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "lineHeight");
    if (v != "") {
	htmlElement.style.setProperty("line-height", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "opacity");
    if (v != "") {
	htmlElement.style.setProperty("opacity", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "padding");
    if (v != "") {
	htmlElement.style.setProperty("padding", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "textAlign");
    if (v != "") {
	// REVISIT to take into account text direction...
	if (v == "start") {
	    htmlElement.style.setProperty("text-align", "left", "");
	} else if (v == "end") {
	    htmlElement.style.setProperty("text-align", "right", "");
	} else {
	    htmlElement.style.setProperty("text-align", v, "");
	}
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "textDecoration");
    if (v != "") {
	if (v == "noUnderline" || v == "noOverline" || v == "noLineThrough") {
	    // this is not accurate
	    v = "none";
	} else if (v == "lineThrough") {
	    v = "line-through";
	}
	htmlElement.style.setProperty("text-decoration", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "unicodeBidi");
    if (v != "") {
	if (v == "bidiOverride") {
	    v = "bidi-override";
	}
	htmlElement.style.setProperty("unicode-bidi", v, "");
    }
    v = dfxpElement.getAttributeNS(DFXP_NS_Style, "visibility");
    if (v != "") {
	htmlElement.style.setProperty("visibility", v, "");
    }
    v = dfxpElement.getAttribute("xml:space");
    if (v != null && v != "") {
	if (v == "preserve") {
	    v = "pre";
	    htmlElement.spaces = true;
	} else {
	    v = "normal";
	}
	htmlElement.style.setProperty("white-space", v, "");
    }

}

HTML5Caption_convertDFXP2HTML = function(dfxpNode) {
    var htmlNode = null;

    if (dfxpNode.aDur == 0) {
	return null;
    }

    if (dfxpNode.nodeType == 3 || dfxpNode.nodeType == 4) {
	// TEXT_NODE or CDATA_SECTION_NODE
	if (dfxpNode.parentNode.localName != "p"
	    && dfxpNode.parentNode.localName != "span") {
	    // clean up the tree, we don't need to keep text nodes outside p or span
	    return null;
	}
	if (dfxpNode.parentNode.tContainer == DFXP_TIME_CONTAINER_SEQ) {
	    // text nodes are always within an "anonymous
	    // span". if that anonymous span is inside a seq
	    // container, then its implicit duration is 0, so
	    // ignore it.
	    return null;
	}
	htmlNode = document.createTextNode(dfxpNode.data);
    } else if (dfxpNode.nodeType == 1) {
	// ELEMENT_NODE
	if (dfxpNode.namespaceURI == DFXP_NS_Metadata_Extensions
	    || dfxpNode.namespaceURI == DFXP_NS_Metadata) {
	    // ignore metadata stuff
	    return null;
	} else {		
	    if (dfxpNode.namespaceURI == DFXP_NS) {
		if (dfxpNode.aDur <= 0) {
		    // eliminates non-active elements
		    return null;
		}
		var region = dfxpNode.getAttribute("region");
		if (region == "") region = null;
		if (dfxpNode.localName == "span") {
		    if (region != null) return null;
		    htmlNode = document.createElementNS(XHTML_NS, "span");
		} else if (dfxpNode.localName == "p") {
		    if (region != null) return null;
		    htmlNode = document.createElementNS(XHTML_NS, "p");
		} else if (dfxpNode.localName == "div") {
		    if (region != null) return null;
		    htmlNode = document.createElementNS(XHTML_NS, "div");
		} else if (dfxpNode.localName == "br") {
		    htmlNode = document.createElementNS(XHTML_NS, "br");
		} else if (dfxpNode.localName == "body") {
		    if (region != null) throw new Error("Region on body element is not supported");
		    htmlNode = document.createElementNS(XHTML_NS, "div");
		    htmlNode.className = 'dfxp';
		} else {
		    // @@TODO animation
		    return null;
		}
		
	    } else {
		// there is something here, but it's not dfxp, let's copy it as-is if XHTML
		if (dfxpNode.namespaceURI == XHTML_NS) {
		    try {
			htmlNode = document.importNode(dfxpNode, true);
		    } catch (e) {
			return null;
		    }
		}
	    }
	}
    }
        
    htmlNode.aBegin = dfxpNode.aBegin;
    htmlNode.aEnd   = dfxpNode.aEnd;

    if (HTML5Caption_debug && htmlNode.nodeType == 1) {
	htmlNode.setAttribute("relative_begin", dfxpNode.rBegin);
	htmlNode.setAttribute("relative_end", dfxpNode.rEnd);
	htmlNode.setAttribute("relative_dur", dfxpNode.rDur);
	htmlNode.setAttribute("active_begin", dfxpNode.aBegin);
	htmlNode.setAttribute("active_end", dfxpNode.aEnd);
	htmlNode.setAttribute("active_dur", dfxpNode.aDur);
	var container = null;
	if (dfxpNode.tContainer == DFXP_TIME_CONTAINER_PAR) {
	    container = "par";
	} else if (dfxpNode.tContainer == DFXP_TIME_CONTAINER_SEQ) {
	    container = "seq";
	}
	if (container != null) {
	    htmlNode.setAttribute("timeContainer", container);
	}
    }

    if (dfxpNode.tContainer) {
	HTML5Caption_convertDFXP2HTMLAttributes(dfxpNode, htmlNode);
	
	if (HTML5Caption_debug) {
	    if (htmlNode.localName == "p" || htmlNode.localName == "div" || htmlNode.localName == "span") {
		htmlNode.appendChild(document.createTextNode("[" + htmlNode.aBegin + "-" + htmlNode.aEnd + "]"));
	    }
	}
	var childNodes = dfxpNode.childNodes;
	for (var i = 0; i < childNodes.length; i++) {
	    var r = HTML5Caption_convertDFXP2HTML(childNodes.item(i));
	    if (r!= null) {
		htmlNode.appendChild(r);
	    }
	}
    }

    return htmlNode;
}

var TIME_INDEFINITE            = -1;
var TIME_INFINITY_AND_BEYOND   = Infinity;

HTML5Caption_convertDFXPDuration = function(d) {
    var i = 0;
    if (d ==null || d == "") {
	return TIME_INDEFINITE;
    } else if (d.indexOf(':') != -1) {
	return HTML5Caption_toSeconds(d);
    } else if ((i = d.indexOf('h')) != -1) {
	return parseFloat(d.substring(0, i)) * 3600;
    } else if ((i = d.indexOf('m')) != -1) {
	return parseFloat(d.substring(0, i)) * 60;
    } else if ((i = d.indexOf('s')) != -1) {
	return parseFloat(d.substring(0, i));
    } else if ((i = d.indexOf('ms')) != -1) {
	return parseFloat(d.substring(0, i)) / 1000;
    } else if ((i = d.indexOf('t')) != -1) {
	throw new Error("tick duration is not supported");
    } else if ((i = d.indexOf('f')) != -1) {
	throw new Error("frame duration is not supported");
    }
}

HTML5Caption_computeRelativeTimeIntervals = function(dfxpNode) {
    // we only accept body, div, p, and span
    if (dfxpNode.namespaceURI != DFXP_NS
	|| !(dfxpNode.localName == "body"
	     || dfxpNode.localName == "div"
	     || dfxpNode.localName == "p"
	     || dfxpNode.localName == "span")) {
	if (dfxpNode.parentNode.localName != "p"
	    && dfxpNode.parentNode.localName != "span") {
	    // clean up the tree, we don't need to keep nodes outside p or span
	    dfxpNode.rBegin = 0;
	    dfxpNode.rEnd   = 0;
	    dfxpNode.rDur   = 0;
	} else if (dfxpNode.parentNode.tContainer == DFXP_TIME_CONTAINER_SEQ) {
	    // nodes are always within an "anonymous span". if that
	    // anonymous span is inside a seq container, then its
	    // implicit duration is 0, so ignore it.
	    dfxpNode.rBegin = 0;
	    dfxpNode.rEnd   = 0;
	    dfxpNode.rDur   = 0;
	} else if (dfxpNode.parentNode.tContainer == DFXP_TIME_CONTAINER_PAR) {	    
	    dfxpNode.rBegin = 0;
	    dfxpNode.rEnd   = TIME_INFINITY_AND_BEYOND;
	    dfxpNode.rDur   = TIME_INFINITY_AND_BEYOND;
	}
	return;
    }

    // for each node, we're going to compute the time container and
    // its corresponding relative time interval.
    //
    // we'll decorate the tree with the results:
    //   dfxpNode.tContainer
    //   dfxpNode.rBegin
    //   dfxpNode.rEnd
    //   dfxpNode.rDur

    // first, determine the time container (par|seq)

    var timeContainer = dfxpNode.getAttribute("timeContainer");
    if (timeContainer == "seq") {
	dfxpNode.tContainer = DFXP_TIME_CONTAINER_SEQ;
    } else {
	// everything else defaults to par
	dfxpNode.tContainer = DFXP_TIME_CONTAINER_PAR;
    }

    // Now, calculate the specified time interval, if any

    var begin   = HTML5Caption_convertDFXPDuration(dfxpNode.getAttribute("begin"));
    var end     = HTML5Caption_convertDFXPDuration(dfxpNode.getAttribute("end"));
    var dur     = HTML5Caption_convertDFXPDuration(dfxpNode.getAttribute("dur"));

    // Note: we give preference to the specified end attribute over the dur
    //       attribute if any
    if (begin != TIME_INDEFINITE) {
	if (end != TIME_INDEFINITE) {
	    dur = end - begin;
	} else if (dur != TIME_INDEFINITE) {
	    end = begin + dur;
	}
    } else {
	// Children of a par begin by default when the par begins
	// (equivalent to begin="0s"). Children of a seq begin by
	// default when the previous child ends its active duration
	// (equivalent to begin="0s");
	begin = 0;
	if (end != TIME_INDEFINITE) {
	    dur   = end;
	} else if (dur != TIME_INDEFINITE) {
	    end   = dur;
	}
    }

    if (dur <= 0) {
	// bogus interval, let's ignore it
	end = TIME_INDEFINITE;
	dur = TIME_INDEFINITE;
    }

    if (dur == TIME_INDEFINITE
	&& dfxpNode.parentNode.tContainer == DFXP_TIME_CONTAINER_SEQ) {
	// if the element's parent time container is a sequential time
	// container, then the implicit duration is equivalent to
	// zero.

	begin = 0;
	end = 0;
	dur = 0;
    } // else {
    // if the element's parent time container is a parallel time
    // container, then the implicit duration is equivalent to the
    // indefinite duration value
    // }    

    // set the relative time interval. 
    // for a par, its' relative to its parent.
    // for a seq, it's relative to its previous sibling or the its
    // parent if no previous sibling.
    dfxpNode.rBegin = begin;  // 0 or higher
    dfxpNode.rEnd   = end;    // TIME_INDEFINITE or >= begin
    dfxpNode.rDur   = dur;    // TIME_INDEFINITE or >= 0

    // now calculate the relative time intervals for the children
    var childNodes = dfxpNode.childNodes;

    for (var i = 0; i < childNodes.length; i++) {
	var node = childNodes.item(i);
	HTML5Caption_computeRelativeTimeIntervals(node);
    }

    // done.

    if (dfxpNode.rEnd == TIME_INDEFINITE) {
	// we still don't have a relative time interval for the node
	// so now, we're going to see if we can get one from the children

	if (dfxpNode.tContainer == DFXP_TIME_CONTAINER_PAR) {

	    // The implicit duration ends with the last end of the
	    // child elements.
	    var childNodes = dfxpNode.childNodes;
	    for (var i = 0; i < childNodes.length; i++) {
		var node = childNodes.item(i);
		if (node.rEnd > dfxpNode.rEnd) {
		    dfxpNode.rEnd = node.rEnd;
		}
	    }
	} else { // dfxpNode.tContainer == DFXP_TIME_CONTAINER_SEQ

	    // The implicit duration of a seq ends with the end of the
	    // last child of the seq.

	    var abort = false;
	    var totalTime = 0;
	    var childNodes = dfxpNode.childNodes;
	    for (var i = 0; !abort && i < childNodes.length; i++) {
		var node = childNodes.item(i);
		if (node.rEnd == TIME_INDEFINITE) {
		    // that's not good. all children must have a
		    // duration
		    abort = true;
		}
		totalTime += node.rDur + node.rBegin;
	    }
	    if (!abort) {
		dfxpNode.rEnd = totalTime;
	    }
	}
	if (dfxpNode.rEnd != TIME_INDEFINITE) {
	    dfxpNode.rDur = dfxpNode.rEnd - dfxpNode.rBegin;
	}

    }
}

HTML5Caption_computeActiveTimeIntervals = function(dfxpNode) {

    // for each node, we're going to compute the active time
    // intervals, ie the time intervals relative to the time interval
    // of the body element
    //
    // we'll decorate the tree with the results:
    //   dfxpNode.aBegin
    //   dfxpNode.aEnd
    //   dfxpNode.aDur
    //
    // Note that this is a two steps process:
    //  first, we'll compute the relative time intervals
    //  second,  we'll compute the active time intervals

    // first, determine the relative time intervals    
    if (dfxpNode.nodeType == 1
	&& dfxpNode.namespaceURI == DFXP_NS
	&& dfxpNode.localName == "body") {
	HTML5Caption_computeRelativeTimeIntervals(dfxpNode);
    }


    dfxpNode.aBegin = TIME_INDEFINITE;
    dfxpNode.aEnd   = TIME_INDEFINITE;
    dfxpNode.aDur   = TIME_INDEFINITE;

    var parentNode = dfxpNode.parentNode;

    // transfer the time intervals from relative to active
    if (dfxpNode.localName == "body") {
	dfxpNode.aBegin = dfxpNode.rBegin;
	dfxpNode.aEnd   = dfxpNode.rEnd;
    } else if (parentNode.tContainer == DFXP_TIME_CONTAINER_PAR) {
	if (dfxpNode.rDur != TIME_INDEFINITE) {
	    // the active time is calculated based on its relative
	    // time and the active time of its parent
	    dfxpNode.aBegin = dfxpNode.rBegin + dfxpNode.parentNode.aBegin;	
	    dfxpNode.aEnd   = dfxpNode.rEnd + dfxpNode.parentNode.aBegin;
	}
    } else { // parentNode.tContainer == DFXP_TIME_CONTAINER_SEQ
	if (dfxpNode.rDur != TIME_INDEFINITE) {
	    var previousSibling = dfxpNode.previousSibling;
	    while (previousSibling != null
		   && !(previousSibling.tContainer)) {
		// previousSibling with no time container have a duration of 0
		// so we'll skip them
		previousSibling = previousSibling.previousSibling;
	    }
	    
	    if (previousSibling != null) {
		if (previousSibling.aDur != TIME_INDEFINITE) {
		    // the active time is calculated base on its
		    // relative time and the active of its previous
		    // sibling that contains a time
		    dfxpNode.aBegin = dfxpNode.rBegin + previousSibling.aEnd;
		    dfxpNode.aEnd   = dfxpNode.rEnd + previousSibling.aEnd;
		}
	    } else {
		if (dfxpNode.rDur != TIME_INDEFINITE) {
		    // No previous sibling, so the active time is
		    // calculated based on its relative time and the
		    // active time of its parent
		    dfxpNode.aBegin = dfxpNode.rBegin + dfxpNode.parentNode.aBegin;
		    dfxpNode.aEnd   = dfxpNode.rEnd + dfxpNode.parentNode.aBegin;
		}
	    }
	}
    }
    // check that the active time interval is within its parent
    // and set the active duration
    if (dfxpNode.aEnd != TIME_INDEFINITE) {
	if (dfxpNode.aEnd > dfxpNode.parentNode.aEnd) {
	    // it can't end after its parent
	    dfxpNode.aEnd = dfxpNode.parentNode.aEnd;
	}
	if (dfxpNode.aBegin > dfxpNode.aEnd) {
	    // it can't begin after its end
	    dfxpNode.aBegin = TIME_INDEFINITE;
	    dfxpNode.aEnd = TIME_INDEFINITE;
	} else {
	    dfxpNode.aDur = dfxpNode.aEnd - dfxpNode.aBegin;
	}
    }

    if (dfxpNode.aDur != TIME_INDEFINITE && dfxpNode.tContainer) {
	// we have an active time interval, so now calculate the active time
	// intervals for the children
	var childNodes = dfxpNode.childNodes;
	
	for (var i = 0; i < childNodes.length; i++) {
	    HTML5Caption_computeActiveTimeIntervals(childNodes.item(i));
	}
    }
}
    
HTML5Caption_getSubtitleSetRef = function(htmlElement, set) {    

    if (htmlElement.aBegin >= 0) {
	if (htmlElement.parentNode != null
	    && htmlElement.parentNode.aBegin >= 0
	    && htmlElement.parentNode.aBegin == htmlElement.aBegin
	    && htmlElement.parentNode.aEnd == htmlElement.aEnd) {
	    // if it needs to always be displayed when its parent get displayed
	} else {
	    // we'll need to do something with this one, so add it	    
	    set[set.length] = htmlElement;
	    if (!HTML5Caption_debug) {
		htmlElement.style.display = "none";
	    }
	    htmlElement.df_isInTime      = false;	    
	}
    } else {
	// skip the children
	return;
    }
    
    var children = htmlElement.childNodes;
    var length   = children.length;
    for (var i = 0; i < length; i++) {
	var child = children.item(i);
	if (child.nodeType == 1) {
	    HTML5Caption_getSubtitleSetRef(child, set);
	}
    }

}

HTML5Caption_getSubtitleSet = function(htmlElement) {
    var set = new Array();
    HTML5Caption_getSubtitleSetRef(htmlElement, set);
    return set;
}

HTML5Caption_playDFXP = function(video, dfxpDocument) {    

    dfxpDocument.bodyElement = dfxpDocument.getElementsByTagNameNS(DFXP_NS, "body").item(0);

    // the following function call will decorate the dfxp tree with active durations
    HTML5Caption_computeActiveTimeIntervals(dfxpDocument.bodyElement);

    // convert the resulting tree into HTML
    // mainDiv is here to prevent the DFXP style from messing up with
    // with the main container. mainDiv represents the body
    // element of DFXP
    var mainDiv = HTML5Caption_convertDFXP2HTML(dfxpDocument.bodyElement);

    if (mainDiv == null) return;

    var w = video.getAttribute("width");
    if (w!="") {
	// the main container gets the size of the video
	mainDiv.style.setProperty("width", w, "");
    }

    var subtitles = HTML5Caption_getSubtitleSet(mainDiv);

    video.parentNode.insertBefore(mainDiv, video.nextSibling);

    if (HTML5Caption_debug) {
	alert("We have " + subtitles.length + " in the set " + mainDiv.aBegin + "-" + mainDiv.aEnd);
	return;
    }
    var currentTime = video.currentTime;

    if (typeof currentTime == "undefined") {
	throw new Error("currentTime is not supported by the Video element");
    } else {
	var length = subtitles.length;
	setInterval(function() {
		if (!video.paused) {
		    currentTime = video.currentTime;
		    for (var i = 0; i < length; i++) {
			node = subtitles[i];
			// this might get slow if too many subtitles?
			if (node.df_isInTime) {
			    if (node.aEnd < currentTime
				|| node.aBegin > currentTime)  {
				// remove the element from the display since
				// it's in a node in the past or future
				node.style.display = "none";
				node.df_isInTime = false;
			    }
			} else if (node.aBegin < currentTime 
				   && node.aEnd > currentTime) {
			    node.style.display = node.df_displayValue;
			    node.df_isInTime = true;
			}			    
		    }
		}
	    }, 100);
    }
}


HTML5Caption_playVideo = function(video, caption) {
    var xhr = new XMLHttpRequest();
    var type = caption.getAttribute("type");
    
    if (type == "application/ttaf+xml") {
	xhr.onreadystatechange = function () {
	    if (this.readyState == 4
		&& this.status == 200) {
		
		if (this.responseXML != null) {
		    HTML5Caption_playDFXP(this.video, this.responseXML);
		} else {
		    throw new Error("Can't read DFXP resource");
		}
	    }
	};
    } else if (type == "text/x-srt") {
	xhr.onreadystatechange = function () {
	    if (this.readyState == 4
		&& this.status == 200) {
		if (this.responseText != null) {
		    // success!
		    HTML5Caption_playSRT(this.video, this.responseText);
		} else {
		    throw new Error("Can't read DFXP resource");
		}
	    }
	};
    } else {
	throw new Error("Caption format not supported");
    }
    xhr.video = video;

    xhr.open("GET", caption.getAttribute("src"), true);
    xhr.send("");
}




function init_captions() {
    var textElements = document.getElementsByTagName("text");
    var srtElement = null;
    var dfxpElement = null;

    for (var i = 0; i < textElements.length; i++) {
	var e = textElements.item(i);
	var type = e.getAttribute("type");
	// @@ should take into account @lang
	if (type == "application/ttaf+xml" && e.getAttribute("src")) {
	    dfxpElement = e;
	} else if (type == "text/x-srt" && e.getAttribute("src")) {
	    srtElement = e;
	}
    }

    if (dfxpElement != null) {
	HTML5Caption_playVideo(dfxpElement.parentNode, dfxpElement);
    } else if (srtElement != null) {
	HTML5Caption_player.playVideo(srtElement.parentNode, srtElement);
    }
}


