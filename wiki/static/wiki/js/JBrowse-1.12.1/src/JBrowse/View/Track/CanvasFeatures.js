//>>built
define("JBrowse/View/Track/CanvasFeatures", "dojo/_base/declare,dojo/_base/array,dojo/_base/lang,dojo/_base/event,dojo/mouse,dojo/dom-construct,dojo/Deferred,dojo/on,JBrowse/has,JBrowse/Util,JBrowse/View/GranularRectLayout,JBrowse/View/Track/BlockBased,JBrowse/View/Track/_ExportMixin,JBrowse/Errors,JBrowse/View/Track/_FeatureDetailMixin,JBrowse/View/Track/_FeatureContextMenusMixin,JBrowse/View/Track/_YScaleMixin,JBrowse/Model/Location,JBrowse/Model/SimpleFeature".split(","), function (t, l, m, p, G, o, u,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          r, v, s, w, x, y, z, A, B, C, D, E) {
    var F = t(null, {
        constructor: function (a) {
            this.dims = {h: a.h, w: a.w};
            this.byID = {}
        }, getByID: function (a) {
            return this.byID[a]
        }, addAll: function (a) {
            var b = this.byID;
            l.forEach(a, function (a) {
                a && (b[a.f.id()] = a)
            }, this)
        }, getAll: function () {
            var a = [], b;
            for (b in this.byID)a.push(this.byID[b]);
            return a
        }
    });
    return t([x, A, y, B, C], {
        constructor: function () {
            this.glyphsLoaded = {};
            this.glyphsBeingLoaded = {};
            this.regionStats = {};
            this.showLabels = this.config.style.showLabels;
            this.showTooltips = this.config.style.showTooltips;
            this.displayMode = this.config.displayMode;
            var a = this.browser.cookie("track-" + this.name);
            if (a)this.displayMode = a;
            this._setupEventHandlers()
        }, _defaultConfig: function () {
            return s.deepUpdate(m.clone(this.inherited(arguments)), {
                maxFeatureScreenDensity: 0.5,
                glyph: m.hitch(this, "guessGlyphType"),
                maxFeatureGlyphExpansion: 500,
                maxHeight: 600,
                histograms: {
                    description: "feature density",
                    min: 0,
                    height: 100,
                    color: "goldenrod",
                    clip_marker_color: "red"
                },
                style: {
                    _defaultHistScale: 4, _defaultLabelScale: 30, _defaultDescriptionScale: 120,
                    showLabels: !0, showTooltips: !0, label: "name,id", description: "note, description"
                },
                displayMode: "normal",
                events: {
                    contextmenu: function (a, b, c, d, e) {
                        e = p.fix(e);
                        b && b.contextMenu && b.contextMenu._openMyself({
                            target: c.featureCanvas,
                            coords: {x: e.pageX, y: e.pageY}
                        });
                        p.stop(e)
                    }
                },
                menuTemplate: [{
                    label: "View details",
                    title: "{type} {name}",
                    action: "contentDialog",
                    iconClass: "dijitIconTask",
                    content: dojo.hitch(this, "defaultFeatureDetail")
                }, {
                    label: function () {
                        return "Zoom to this " + (this.feature.get("type") || "feature")
                    }, action: function () {
                        var a =
                            this.track.refSeq, b = Math.round(10 / this.viewInfo.scale), c = Math.max(a.start, this.feature.get("start") - b), b = Math.min(a.end, this.feature.get("end") + b);
                        this.track.genomeView.setLocation(a, c, b)
                    }, iconClass: "dijitIconConnector"
                }, {
                    label: function () {
                        return "Highlight this " + (this.feature.get("type") || "feature")
                    }, action: function () {
                        this.track.browser.setHighlightAndRedraw(new D({feature: this.feature, tracks: [this.track]}))
                    }, iconClass: "dijitIconFilter"
                }]
            })
        }, setViewInfo: function (a, b, c, d, e, f, g) {
            this.inherited(arguments);
            this.staticCanvas = o.create("canvas", {
                style: {
                    height: "100%",
                    cursor: "default",
                    position: "absolute",
                    zIndex: 15
                }
            }, d);
            this.staticCanvas.height = this.staticCanvas.offsetHeight;
            this._makeLabelTooltip()
        }, guessGlyphType: function (a) {
            return "JBrowse/View/FeatureGlyph/" + ({
                    gene: "Gene",
                    mRNA: "ProcessedTranscript",
                    transcript: "ProcessedTranscript"
                }[a.get("type")] || "Box")
        }, fillBlock: function (a) {
            var b = a.blockIndex, c = a.block, d = a.scale;
            v("canvas") ? this.store.getGlobalStats(m.hitch(this, function (e) {
                e = m.mixin({
                    stats: e,
                    displayMode: this.displayMode,
                    showFeatures: d >= (this.config.style.featureScale || (e.featureDensity || 0) / this.config.maxFeatureScreenDensity),
                    showLabels: this.showLabels && "normal" == this.displayMode && d >= (this.config.style.labelScale || (e.featureDensity || 0) * this.config.style._defaultLabelScale),
                    showDescriptions: this.showLabels && "normal" == this.displayMode && d >= (this.config.style.descriptionScale || (e.featureDensity || 0) * this.config.style._defaultDescriptionScale)
                }, a);
                e.showFeatures ? (this.setLabel(this.key), this.removeYScale(), this.fillFeatures(e)) :
                    this.config.histograms.store || this.store.getRegionFeatureDensities ? this.fillHistograms(e) : (this.setLabel(this.key), this.fillTooManyFeaturesMessage(b, c, d), a.finishCallback())
            }), dojo.hitch(this, function (b) {
                this._handleError(b, a);
                a.finishCallback(b)
            })) : (this.fatalError = "This browser does not support HTML canvas elements.", this.fillBlockError(b, c, this.fatalError))
        }, _handleError: function (a, b) {
            "object" == typeof a && a instanceof z.DataOverflow && (this.config.histograms.store || this.store.getRegionFeatureDensities) ?
                this.fillHistograms(b) : this.inherited(arguments)
        }, _getLayout: function (a) {
            if (!this.layout || this._layoutpitchX != 4 / a) {
                var b = this.getConf("layoutPitchY") || 4;
                this.layout = new w({
                    pitchX: 4 / a,
                    pitchY: b,
                    maxHeight: this.getConf("maxHeight"),
                    displayMode: this.displayMode
                });
                this._layoutpitchX = 4 / a
            }
            return this.layout
        }, _clearLayout: function () {
            delete this.layout
        }, hideAll: function () {
            this._clearLayout();
            return this.inherited(arguments)
        }, getGlyph: function (a, b, c) {
            var d = this.getConfForFeature("glyph", b), e;
            if (e = this.glyphsLoaded[d])c(e);
            else if (a = this.glyphsBeingLoaded[d])a.push(c); else {
                var f = this;
                this.glyphsBeingLoaded[d] = [c];
                require([d], function (a) {
                    e = f.glyphsLoaded[d] = new a({track: f, config: f.config, browser: f.browser});
                    l.forEach(f.glyphsBeingLoaded[d], function (a) {
                        a(e)
                    });
                    delete f.glyphsBeingLoaded[d]
                })
            }
        }, fillHistograms: function (a) {
            this.config.histograms.description ? this.setLabel(this.key + ' <span class="feature-density">(' + this.config.histograms.description + ")</span>") : this.setLabel(this.key);
            var b = this.config.histograms.binsPerBlock ||
                25, b = Math.abs(a.rightBase - a.leftBase) / b, c = {
                ref: this.refSeq.name,
                start: a.leftBase,
                end: a.rightBase,
                basesPerSpan: b,
                basesPerBin: b
            };
            if (!this.config.histograms.store && this.store.getRegionFeatureDensities)this.store.getRegionFeatureDensities(c, m.hitch(this, "_drawHistograms", a)); else {
                var d = this, e = {features: [], stats: {}}, f = m.hitch(this, "_handleError");
                this.browser.getStore(this.config.histograms.store, function (b) {
                    b.getGlobalStats(function (k) {
                        e.stats.max = k.scoreMax;
                        b.getFeatures(c, function (a) {
                                e.features.push(a)
                            },
                            function () {
                                d._drawHistograms(a, e);
                                a.finishCallback()
                            }, f)
                    }, f)
                })
            }
        }, _drawHistograms: function (a, b) {
            var c = "max"in this.config.histograms ? this.config.histograms.max : b.stats.max;
            if (void 0 === c)console.warn("no stats.max in hist data, not drawing histogram for block " + a.blockIndex); else {
                var d;
                if ((d = b.features) || b.bins && (d = this._histBinsToFeatures(a, b))) {
                    var e = a.block, f = this.config.histograms.height, g = a.scale, k = a.leftBase, q = this.config.histograms.min;
                    o.empty(e.domNode);
                    var h = e.featureCanvas = o.create("canvas",
                        {
                            height: f,
                            width: e.domNode.offsetWidth + 1,
                            style: {cursor: "default", height: f + "px", position: "absolute"},
                            innerHTML: "Your web browser cannot display this type of track.",
                            className: "canvas-track canvas-track-histograms"
                        }, e.domNode);
                    this.heightUpdate(f, a.blockIndex);
                    var e = h.getContext("2d"), i = s.getResolution(e, this.browser.config.highResolutionMode);
                    if ("disabled" != this.browser.config.highResolutionMode && 1 <= i) {
                        var n = h.width, j = h.height;
                        h.width = n * i;
                        h.height = j * i;
                        h.style.width = n + "px";
                        h.style.height = j + "px";
                        e.scale(i,
                            i)
                    }
                    e.fillStyle = this.config.histograms.color;
                    for (h = 0; h < d.length; h++)if (j = d[h], i = j.get("score") / c * f, n = Math.ceil((j.get("end") - j.get("start")) * g), j = Math.round((j.get("start") - k) * g), e.fillRect(j, f - i, n, i), i > f)e.fillStyle = this.config.histograms.clip_marker_color, e.fillRect(j, 0, n, 3), e.fillStyle = this.config.histograms.color;
                    this.makeHistogramYScale(f, q, c)
                }
            }
        }, _histBinsToFeatures: function (a, b) {
            var c = parseFloat(b.stats.basesPerBin), d = a.leftBase;
            return l.map(b.bins, function (a, b) {
                return new E({
                    data: {
                        start: d + b *
                        c, end: d + (b + 1) * c, score: a
                    }
                })
            })
        }, makeHistogramYScale: function (a, b, c) {
            if (!this.yscale_params || !(this.yscale_params.height == a && this.yscale_params.max == c && this.yscale_params.min == b))this.yscale_params = {
                height: a,
                min: b,
                max: c
            }, this.makeYScale({min: b, max: c})
        }, fillFeatures: function (a) {
            var b = this, c = a.blockIndex, d = a.block, e = d.domNode.offsetWidth, f = a.scale, g = a.leftBase, k = a.rightBase, q = a.finishCallback, h = [], i = 0, n = new u, j = !1, l = dojo.hitch(b, function (b) {
                this._handleError(b, a);
                q(b)
            }), m = this._getLayout(f), f = Math.round(this.config.maxFeatureGlyphExpansion /
                f);
            this.store.getFeatures({ref: this.refSeq.name, start: Math.max(0, g - f), end: k + f}, function (c) {
                if (!b.destroyed && b.filterFeature(c)) {
                    h.push(null);
                    i++;
                    var f = h.length - 1;
                    b.getGlyph(a, c, function (b) {
                        b = b.layoutFeature(a, m, c);
                        null === b ? d.maxHeightExceeded = !0 : b.l >= e || 0 > b.l + b.w || (h[f] = b);
                        !--i && j && n.resolve()
                    }, l)
                }
            }, function () {
                b.destroyed || (j = !0, !i && !n.isFulfilled() && n.resolve(), n.then(function () {
                    var e = m.getTotalHeight(), f = d.featureCanvas = o.create("canvas", {
                        height: e, width: d.domNode.offsetWidth + 1, style: {
                            cursor: "default",
                            height: e + "px", position: "absolute"
                        }, innerHTML: "Your web browser cannot display this type of track.", className: "canvas-track"
                    }, d.domNode), g = f.getContext("2d"), k = s.getResolution(g, b.browser.config.highResolutionMode);
                    if ("disabled" != b.browser.config.highResolutionMode && 1 <= k) {
                        var i = f.width, j = f.height;
                        f.width = i * k;
                        f.height = j * k;
                        f.style.width = i + "px";
                        f.style.height = j + "px";
                        g.scale(k, k)
                    }
                    d.maxHeightExceeded && b.markBlockHeightOverflow(d);
                    b.heightUpdate(e, c);
                    b.renderFeatures(a, h);
                    b.renderClickMap(a, h);
                    q()
                }))
            }, l)
        },
        startZoom: function () {
            this.inherited(arguments);
            l.forEach(this.blocks, function (a) {
                try {
                    a.featureCanvas.style.width = "100%"
                } catch (b) {
                }
            })
        }, endZoom: function () {
            l.forEach(this.blocks, function (a) {
                try {
                    delete a.featureCanvas.style.width
                } catch (b) {
                }
            });
            this.clear();
            this.inherited(arguments)
        }, renderClickMap: function (a, b) {
            var c = a.block, d = new F({h: c.featureCanvas.height, w: c.featureCanvas.width});
            c.fRectIndex = d;
            d.addAll(b);
            !c.featureCanvas || !c.featureCanvas.getContext("2d") ? console.warn("No 2d context available from canvas") :
                (this._attachMouseOverEvents(), this._connectEventHandlers(c), this.updateStaticElements({x: this.browser.view.getX()}))
        }, _attachMouseOverEvents: function () {
            var a = this.browser.view, b = this;
            if ("collapsed" == this.displayMode)this._mouseoverEvent && (this._mouseoverEvent.remove(), delete this._mouseoverEvent), this._mouseoutEvent && (this._mouseoutEvent.remove(), delete this._mouseoutEvent); else {
                if (!this._mouseoverEvent)this._mouseoverEvent = this.own(r(this.staticCanvas, "mousemove", function (c) {
                    var c = p.fix(c), d = a.absXtoBp(c.clientX),
                        d = b.layout.getByCoord(d, void 0 === c.offsetY ? c.layerY : c.offsetY);
                    b.mouseoverFeature(d, c)
                }))[0];
                if (!this._mouseoutEvent)this._mouseoutEvent = this.own(r(this.staticCanvas, "mouseout", function () {
                    b.mouseoverFeature(void 0)
                }))[0]
            }
        }, _makeLabelTooltip: function () {
            if (this.showTooltips && !this.labelTooltip) {
                var a = this.labelTooltip = o.create("div", {
                    className: "featureTooltip",
                    style: {position: "fixed", display: "none", zIndex: 19}
                }, document.body);
                o.create("span", {className: "tooltipLabel", style: {display: "block"}}, a);
                o.create("span",
                    {className: "tooltipDescription", style: {display: "block"}}, a)
            }
        }, _connectEventHandlers: function (a) {
            for (var b in this.eventHandlers)(function (b, d) {
                var e = this;
                a.own(r(this.staticCanvas, b, function (b) {
                    var b = p.fix(b), c = e.browser.view.absXtoBp(b.clientX);
                    if (a.containsBp(c) && (c = e.layout.getByCoord(c, void 0 === b.offsetY ? b.layerY : b.offsetY))) {
                        var k = a.fRectIndex.getByID(c.id());
                        d.call({track: e, feature: c, fRect: k, block: a, callbackArgs: [e, c, k]}, c, k, a, e, b)
                    }
                }))
            }).call(this, b, this.eventHandlers[b])
        }, getRenderingContext: function (a) {
            if (!a.block || !a.block.featureCanvas)return null;
            try {
                return a.block.featureCanvas.getContext("2d")
            } catch (b) {
                return console.error(b, b.stack), null
            }
        }, renderFeatures: function (a, b) {
            var c = this.getRenderingContext(a);
            if (c) {
                var d = this;
                l.forEach(b, function (a) {
                    a && d.renderFeature(c, a)
                })
            }
        }, mouseoverFeature: function (a, b) {
            if (this.lastMouseover != a) {
                if (b)var c = this.browser.view.absXtoBp(b.clientX);
                if (this.labelTooltip)this.labelTooltip.style.display = "none";
                l.forEach(this.blocks, function (d) {
                    if (d) {
                        var e = this.getRenderingContext({
                            block: d,
                            leftBase: d.startBase, scale: d.scale
                        });
                        if (e) {
                            if (this.lastMouseover && d.fRectIndex) {
                                var f = d.fRectIndex.getByID(this.lastMouseover.id());
                                f && this.renderFeature(e, f)
                            }
                            d.tooltipTimeout && window.clearTimeout(d.tooltipTimeout);
                            if (a) {
                                var g = d.fRectIndex && d.fRectIndex.getByID(a.id());
                                if (g) {
                                    if (d.containsBp(c))f = dojo.hitch(this, function () {
                                        if (this.labelTooltip) {
                                            var c = g.label || g.glyph.makeFeatureLabel(a), d = g.description || g.glyph.makeFeatureDescriptionLabel(a);
                                            if (c || d) {
                                                if (!this.ignoreTooltipTimeout)this.labelTooltip.style.left =
                                                    b.clientX + "px", this.labelTooltip.style.top = b.clientY + 15 + "px";
                                                this.ignoreTooltipTimeout = !0;
                                                this.labelTooltip.style.display = "block";
                                                var e = this.labelTooltip.childNodes[0], f = this.labelTooltip.childNodes[1];
                                                this.config.onClick && this.config.onClick.label ? (d = m.mixin({
                                                    track: this,
                                                    feature: a,
                                                    callbackArgs: [this, a]
                                                }), e.style.display = "block", e.style.font = c.font, e.style.color = c.fill, e.innerHTML = this.template(a, this._evalConf(d, this.config.onClick.label, "label"))) : (c ? (e.style.display = "block", e.style.font = c.font,
                                                    e.style.color = c.fill, e.innerHTML = c.text) : (e.style.display = "none", e.innerHTML = "(no label)"), d ? (f.style.display = "block", f.style.font = d.font, f.style.color = d.fill, f.innerHTML = d.text) : (f.style.display = "none", f.innerHTML = "(no description)"))
                                            }
                                        }
                                    }), this.ignoreTooltipTimeout ? f() : d.tooltipTimeout = window.setTimeout(f, 600);
                                    g.glyph.mouseoverFeature(e, g);
                                    this._refreshContextMenu(g)
                                }
                            } else d.tooltipTimeout = window.setTimeout(dojo.hitch(this, function () {
                                this.ignoreTooltipTimeout = !1
                            }), 200)
                        }
                    }
                }, this);
                this.lastMouseover =
                    a
            }
        }, cleanupBlock: function (a) {
            this.inherited(arguments);
            a && this.layout && this.layout.discardRange(a.startBase, a.endBase)
        }, renderFeature: function (a, b) {
            b.glyph.renderFeature(a, b)
        }, _trackMenuOptions: function () {
            var a = this.inherited(arguments), b = this;
            this.displayModeMenuItems = ["normal", "compact", "collapsed"].map(function (a) {
                return {
                    label: a,
                    type: "dijit/CheckedMenuItem",
                    title: "Render this track in " + a + " mode",
                    checked: b.displayMode == a,
                    onClick: function () {
                        b.displayMode = a;
                        b._clearLayout();
                        b.hideAll();
                        b.genomeView.showVisibleBlocks(!0);
                        b.makeTrackMenu();
                        b.browser.cookie("track-" + b.name, b.displayMode)
                    }
                }
            });
            dojo.hitch(this, function () {
                for (var a in this.displayModeMenuItems)this.displayModeMenuItems[a].checked = this.displayMode == this.displayModeMenuItems[a].label
            });
            a.push.apply(a, [{type: "dijit/MenuSeparator"}, {
                label: "Display mode",
                iconClass: "dijitIconPackage",
                title: "Make features take up more or less space",
                children: this.displayModeMenuItems
            }, {
                label: "Show labels", type: "dijit/CheckedMenuItem", checked: !!("showLabels"in this ? this.showLabels :
                    this.config.style.showLabels), onClick: function () {
                    b.showLabels = this.checked;
                    b.changed()
                }
            }]);
            return a
        }, _exportFormats: function () {
            return [{name: "GFF3", label: "GFF3", fileExt: "gff3"}, {
                name: "BED",
                label: "BED",
                fileExt: "bed"
            }, {name: "SequinTable", label: "Sequin Table", fileExt: "sqn"}]
        }, updateStaticElements: function (a) {
            this.inherited(arguments);
            this.updateYScaleFromViewDimensions(a);
            if (a.hasOwnProperty("x")) {
                var b = this.staticCanvas.getContext("2d");
                this.staticCanvas.width = this.browser.view.elem.clientWidth;
                this.staticCanvas.style.left =
                    a.x + "px";
                b.clearRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);
                var c = this.browser.view.minVisible(), d = this.browser.view.maxVisible(), e = {
                    minVisible: c,
                    maxVisible: d,
                    bpToPx: dojo.hitch(this.browser.view, "bpToPx"),
                    lWidth: this.label.offsetWidth
                };
                l.forEach(this.blocks, function (a) {
                    if (a && a.fRectIndex) {
                        var a = a.fRectIndex.byID, c;
                        for (c in a) {
                            var d = a[c];
                            d.glyph.updateStaticElements(b, d, e)
                        }
                    }
                }, this)
            }
        }, heightUpdate: function (a, b) {
            this.inherited(arguments);
            if (this.staticCanvas)this.staticCanvas.height = this.staticCanvas.offsetHeight
        },
        destroy: function () {
            this.destroyed = !0;
            o.destroy(this.staticCanvas);
            delete this.staticCanvas;
            delete this.layout;
            delete this.glyphsLoaded;
            this.inherited(arguments)
        }
    })
});