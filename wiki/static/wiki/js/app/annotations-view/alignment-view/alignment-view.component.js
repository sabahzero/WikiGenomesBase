angular.module("alignmentView")

    .controller("alignmentCtrl", function(orthoData, geneSequenceData, alignOrthologData, proteinSequenceData) {
        'use strict';
        var ctrl = this;


        // initial variable setup
        ctrl.projection = {};
        ctrl.type = "dna";
        ctrl.alignMessage = "Aligning Orthologs. Please be patient.";
        ctrl.citation = false;
        ctrl.isRendered = false;

        // Get ortholog data from wikidata
        ctrl.data = {};
        orthoData.getOrthologs(ctrl.locusTag).then(function(response) {

            // now add results from sparql query
            angular.forEach(response.results.bindings, function(obj) {
                var tax = obj.orthoTaxid.value;
                var tag = obj.orthoLocusTag.value;
                ctrl.hasOrthologs = true;
                ctrl.projection[tax] = true;
                ctrl.data[tax] = [tag, obj.refseq.value];
            });

        });

        // for selecting from the check list
        ctrl.select = function(checked, value) {
            ctrl.projection[value] = checked;
        };
        
        // function to update the selected list and align after
        ctrl.alignData = function() {

            // holds gene sequence data
            var data = [];
            var index = 0;

            // get the sequence data based on ncbi
            //key = taxid, value = true/false
            angular.forEach(ctrl.projection, function(value, key) {
                if (value) {
                    var promise;
                    if (ctrl.type == "dna") {
                        promise = geneSequenceData.getSequence(ctrl.data[key][0]);
                    } else {
                        promise = proteinSequenceData.getSequence(ctrl.data[key][1]);
                    }
                    promise.then(function(seq) {
                        index++;
                        data.push(seq);

                        if (index == Object.keys(ctrl.projection).length) {
                            ctrl.aligning = true;

                            // now align it
                            alignOrthologData.align(data, ctrl);
                            ctrl.citation = true;
                        }
                    }, function(error) {
                        index++;
                        ctrl.aligning = false;
                    });
                } else {
                    index++;
                }
            });

        };

    })

    .factory('geneSequenceData', function($http, $q) {
        'use strict';

        var getSequence = function(value) {

            var deferred = $q.defer();

            // first get the UID from the nuccore database
            $http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=' + value).success(function(response) {

                // data in string as xml, find the ID
                var xml = response;
                if (xml.includes("<Id>")) {

                    // extract the id
                    var id = xml.substring(xml.indexOf("<Id>") + 4, xml.indexOf("</Id>"));

                    // now that we have the ID, get the start and stop from the summary
                    $http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=' + id).success(function(resp) {

                        // the response is in xml again, take out the stop and start sequences
                        xml = resp;
                        var start = parseInt(xml.substring(xml.indexOf("<ChrStart>") + 10, xml.indexOf("</ChrStart>"))) + 1;
                        var stop = parseInt(xml.substring(xml.indexOf("<ChrStop>") + 9, xml.indexOf("</ChrStop>"))) + 1;
                        var accession = xml.substring(xml.indexOf("<ChrAccVer>") + 11, xml.indexOf("</ChrAccVer>"));

                        // which strand to use
                        var strand = 1;

                        if (start > stop) {

                            // strand 2 when start > stop
                            strand = 2;

                            // now swap the start and stop
                            var temp = start;
                            start = stop;
                            stop = temp;
                        }

                        // now do the efetch
                        $http.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=" + accession + "&seq_start=" + start + "&seq_stop=" + stop + "&strand=" + strand + "&rettype=fasta").success(function(r) {

                            // get the human readable name
                            var first = "";
                            if (r.indexOf("Chlamydia") != -1) {
                                first = ">" + r.substring(r.indexOf("Chlamydia") + 10, r.indexOf("\n") + 1);
                            } else {
                                first = ">" + r.substring(r.indexOf("Chlamydophila") + 14, r.indexOf("\n") + 1);
                            }
                            first = first.replace(" ", "_").replace(",", " ");
                            first = first.substring(0, 2).toUpperCase() + first.substring(2);
                            var body = r.substring(r.indexOf("\n") + 1, r.length).replace(/\n/g, "");

                            // the sequence of the gene
                            deferred.resolve(first + body);

                        }).error(function(response) {
                            deferred.reject(response);
                        });
                    }).error(function(response) {
                        deferred.reject(response);
                    });
                }
            });

            // return future gene sequence
            return deferred.promise;

        };

        return {
            getSequence : getSequence
        };
    })

    .factory('proteinSequenceData', function($http, $q) {
        'use strict';

        // value = ref seq ID of protein
        var getSequence = function(refseq) {

            var deferred = $q.defer();

            // first get the UID from the nuccore database
            $http.get("https://www.ncbi.nlm.nih.gov/protein/" + refseq +"?report=fasta")
            
                // success
            .then(function(response) {
                
                console.log(response);
                deferred.resolve(response);
                
                // error
            }, function (response) {
                console.log("Error reading protein sequence");
                deferred.reject(response);
            });

            // return future gene sequence
            return deferred.promise;

        };

        return {
            getSequence : getSequence
        };
    })

    .factory('alignOrthologData', function($http, $timeout, $sce) {

        'use strict';

        // data in form of array of sequences
        var align = function(data, ctrl) {

            // submit POST request
            $http.get("alignOrthologs?sequence=" + encodeURIComponent(data.join("\n")) + "&length=" + encodeURIComponent(data.length)).then(function(response) {
                // JOB ID for muscle
                var id = response.data.id;
                console.log("Job ID:" + id);

                // now repeatedly check the status
                checkId(id, ctrl);
            }, function(response) {
                ctrl.aligning = false;
                console.log("POST TO MUSCLE Error" + response.status);
                console.log(response);

                // display w/o alignment
                var seqs = msa.io.fasta.parse(data.join("\n"));

                // the widget settings
                var settings = {
                    el : document
                        .getElementById("msaDiv"),
                    seqs : seqs
                };

                // the msa viewing panel
                var m = new msa.msa(settings);
                m.render();
                ctrl.isRendered = true;
            });
        };

        // used to constantly check the sequence status
        var checkId = function(id, ctrl) {

            // check by using a GET request
            $http.get('https://www.ebi.ac.uk/Tools/services/rest/muscle/status/' + id).then(
                function(response) {
                    console.log(response.data);

                    // check again if still running
                    if (response.data == "RUNNING") {
                        $timeout(checkId(id, ctrl), 2000);
                        return;
                    }

                    // display the data
                    if (response.data == "FINISHED") {

                        ctrl.aligning = false;

                        // the widget settings
                        var settings = {
                            el : document
                                .getElementById("msaDiv"),
                        };

                        // the msa viewing panel
                        var m = new msa.msa(settings);

                        // data has been aligned, now display it
                        m.u.file.importURL("https://www.ebi.ac.uk/Tools/services/rest/muscle/result/" + id + "/aln-fasta",
                            function() {
                                m.render();
                            }
                        );

                        ctrl.isRendered = true;
                        ctrl.alignmentURL = $sce.trustAsResourceUrl("https://www.ebi.ac.uk/Tools/services/rest/muscle/result/" + id + "/aln-fasta");
                        console.log(ctrl.alignmentURL);

                    // there was a problem
                    } else {
                        console.log("ERROR: " + response.data);
                        ctrl.aligning = false;
                    }
                });

        };

        return {
            align : align
        };

    })

    .component("alignmentView", {
        controller : "alignmentCtrl",
        templateUrl : "/static/wiki/js/angular_templates/alignment-view.html",
        bindings : {
            locusTag : '<',
            taxId : '<',
            allorggenes : '<'
        },
    });