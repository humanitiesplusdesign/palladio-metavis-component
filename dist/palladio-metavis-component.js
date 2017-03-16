/* global angular */
/* global d3 */
angular.module('palladioMetavis', ['palladio', 'palladio.services'])
	.run(['componentService', function(componentService) {
		var compileStringFunction = function (newScope, options) {
			newScope.modifiable = newScope.modifiable !== undefined ? newScope.modifiable : 'true';
			newScope.displayOverview = newScope.displayOverview !== undefined ? newScope.displayOverview : 'true';
			newScope.displayTables = newScope.displayTables !== undefined ? newScope.displayTables : 'true';
			newScope.displayTypes = newScope.displayTypes !== undefined ? newScope.displayTypes : 'false';
			newScope.displayPills = newScope.displayPills !== undefined ? newScope.displayPills : 'false';
			newScope.displayDownload = newScope.displayDownload !== undefined ? newScope.displayDownload : 'true';
			newScope.displayReview = newScope.displayReview !== undefined ? newScope.displayReview : 'false';
			newScope.expanded = newScope.expanded !== undefined ? newScope.expanded : 'false';
			newScope.displayIndex = newScope.displayIndex !== undefined ? newScope.displayIndex : 'all';

			var compileString = '<div data-palladio-metavis ';
			compileString += 'modifiable="' + newScope.modifiable + '" ';
			compileString += 'display-overview="' + newScope.displayOverview + '" ';
			compileString += 'display-tables="' + newScope.displayTables + '" ';
			compileString += 'display-index="' + newScope.displayIndex + '" ';
			compileString += 'display-types="' + newScope.displayTypes + '" ';
			compileString += 'display-pills="' + newScope.displayPills + '" ';
			compileString += 'display-download="' + newScope.displayDownload + '" ';
			compileString += 'display-review="' + newScope.displayReview + '" ';
			compileString += 'expanded="' + newScope.expanded + '" ';
			compileString += ' ></div>';
			return compileString;
		};

		componentService.register('metavis', compileStringFunction);
	}])
	.directive('palladioMetavis', function (palladioService, dataService, parseService, $document) {
		return {
			scope : {
				modifiable: '=',
				expanded: '=',
				displayOverview: '=',
				displayTables: '=',
				displayIndex: '@',
				displayTypes: '=',
				displayReview: '=',
				displayPills: '=',
				displayDownload: '='
			},
			templateUrl : 'partials/palladio-metavis-component/template.html',
			link : {
				pre : function(scope, element) {

					scope.fileForArrowIndexChange = null;
					scope.editModalId = 'dimensionEditModal' + Math.round(Math.random() * 10000)
					
					scope.clearArrowEffect = function() {
						scope.fileForArrowIndexChange = null;
					}
					
					scope.reparseFile = function(d) {
						d.fields.forEach(function(f) { scope.reparseField(f,d); });
					};
					
					scope.reparseField = function(f, d) {
						// Re-parse uniques...
						var md = parseService.parseColumn(f.key,
							d.data, f.mvDelimiter,
							f.hierDelimiter, [], f.type);
						f.uniques = md.uniques;
						f.uniqueValues = f.uniques.map(function(u) { return u.key; });
						f.sourceType = f.sourceType ? f.sourceType : null;

						f.detailType = f.detailType ? f.detailType : (f.type ? f.type : null);
						
						if(f.uniqueKey && f.detailType === "number") {
							f.detailType = 'uniqueNumeric';
						}
						if(f.uniqueKey && f.detailType === "text") {
							f.detailType = 'uniqueText';
						}
						if(f.uniques.length === 2) {
							f.detailType = 'binary0';
						}
						if(f.uniques.length > 2 && f.uniques.length < 10 && f.detailType === 'number') {
							f.detailType = 'ordinalNumeric';
						}
						if(f.uniques.length > 2 && f.uniques.length < 10 && f.detailType === 'text') {
							f.detailType = 'nominalText';
						}
            if(f.detailType === 'numeric') f.detailType = 'number';
            
            if(f.verifiedSpecialChars === undefined) f.verifiedSpecialChars = [];
					};
					
					scope.reparseUniques = function(f,d) {
						var md = parseService.parseColumn(f.key,
							d.data, f.mvDelimiter,
							f.hierDelimiter, [], f.type);
						f.uniques = md.uniques;
						f.uniqueValues = f.uniques.map(function(u) { return u.key; });
					}
					
					scope.codemirrorLoaded = function(editor) {
						editor.on("drop", function(c, e){
							scope.$apply(function(s) {
								s.lastFileName = e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, "") || null;
							})
						});
					};
					
					scope.lastFileName = null;
					
					scope.downloadFile = function(file) {
						var blob = new Blob(
							[ d3.csv.format(file.data) ],
							{type: "text/csv;charset=utf-8"}
						);
						var fileName = file.label + ".csv";
						saveAs(blob, fileName);
					};
					
					scope.selectedFieldMetadata = {};
					scope.selectedFile = {};
					scope.assignSelectedFieldandFile = function(fld, fl) {
						scope.selectedFieldMetadata = fld;
						scope.selectedFile = fl;
						if(scope.modifiable) $('#'+scope.editModalId).modal({ show: true })
					}
					
					scope.colors = {
						uniqueNumeric: '#E0CD29',
						uniqueText: '#E07129',
						numeric: '#BBAA1B',
						number: '#BBAA1B',
						text: '#BB5A1B',
						binary0: '#9988C0',
						binary1: '#CD88BD',
						ordinalNumeric: '#767A79',
						nominalText: '#53585F',
						coordinates: '#A1C088',
						latlong: '#A1C088',
						date: '#577AA4',
						YYYYMMDD: '#577AA4',
						YYYYMM: '#88A1C0',
						YYYY: '#A9BBD2',
						url: '#C0A788',
						'null': '#EEEEEE',
						mismatch: '#EC5D57'
					};

					scope.textColors = {
						uniqueNumeric: '#FFFFFF',
						uniqueText: '#FFFFFF',
						numeric: '#FFFFFF',
						number: '#FFFFFF',
						text: '#FFFFFF',
						binary0: '#FFFFFF',
						binary1: '#FFFFFF',
						ordinalNumeric: '#FFFFFF',
						nominalText: '#FFFFFF',
						coordinates: '#FFFFFF',
						latlong: '#FFFFFF',
						date: '#FFFFFF',
						YYYYMMDD: '#FFFFFF',
						YYYYMM: '#FFFFFF',
						YYYY: '#FFFFFF',
						url: '#FFFFFF',
						'null': '#444444',
						mismatch: '#FFFFFF'
					};
					
					scope.typeTexts = {
						uniqueNumeric: 'Unique Numeric',
						uniqueText: 'Unique Text',
						numeric: 'Numeric',
						number: 'Numeric',
						text: 'Text',
						binary0: 'Binary',
						binary1: 'Binary',
						ordinalNumeric: 'Ordinal Numeric (<10 values)',
						nominalText: 'Nominal Text (<10 values)',
						coordinates: 'Coordinates',
						latlong: 'Coordinates',
						date: 'Date',
						YYYYMMDD: 'Date (YYYY-MM-DD)',
						YYYYMM: 'Date (YYYY-MM)',
						YYYY: 'Date (YYYY)',
						url: 'URL',
						'null': 'not defined',
						mismatch: 'match error'
					}
					
					scope.allowedTypes = [
						{id: 'uniqueNumeric', name: 'Unique Numeric', description: 'Numeric and unique data such as 1234 or 1.234'},
						{id: 'uniqueText', name: 'Unique Text', description: 'Any text-based data that is unique'},
						{id: 'number', name: 'Numeric', description: 'Numeric data such as 1234 or 1.234'},
						{id: 'text', name: 'Text', description: 'Any text-based data'},
						{id: 'binary0', name: 'Binary', description: "Binary data such as Y/N, True/False" },
						{id: 'ordinalNumeric', name: 'Ordinal Numeric', description: "Numeric, categorical data with a limited number (<10) of categories" },
						{id: 'nominalText', name: 'Nominal Text', description: "Text, categorical data with a limited number (<10) or categories" },
						{id: 'coordinates', name: 'Coordinates', description: 'Latitude, Longitude coordinates such as 12.345,67.890'},
						{id: 'date', name: 'Date', description: 'Dates can be YYYY or YYYY-MM-DD'},
						{id: 'url', name: 'URL', description: 'The URL of a website or image such as http://www.example.org/file.yyy'}
					];
					
					scope.sourceTexts = {
						source: 'Directly from source data',
						curated: 'Curated values based on source data',
						authored: 'Authored information',
						generated: 'Generated for visualization or data analysis purposes',
						unknown: 'Unknown source'
					};
					
					scope.sourceTextArray = d3.entries(scope.sourceTexts).map(function(d) {
						d.displayKey = d.key.charAt(0).toUpperCase() + d.key.slice(1);
						return d;
					});
					
					scope.displayVal = function(val) {

						var delimiter = null;
	
						var key = '<span class="small">' + val.key.split(delimiter).reduce(function(prev, curr, i, a) {
							return prev + '&nbsp;'.repeat(i*2) + curr;
						}, "") + '</span>';
	
						var multiples = val.value > 1 ? '<span class="pull-right small muted">' + val.value + '</span>' : '';
	
						return key + multiples;
					};
					
					scope.sortOptions = [
						{ label:'Sort by Value', value:'key', icon: 'fa-sort-alpha-asc', ordering: function(a) { return a.key; } },
						{ label:'Sort by Frequency', value:'value', icon: 'fa-sort-numeric-asc', ordering: function(a) { return -a.value; }}
					];
          
          scope.displayOptions = {
            sortBy : scope.sortOptions[0]
          }
          
          scope.$watch('displayOptions.sortBy', function() {
            scope.sortOrder = scope.displayOptions.sortBy.ordering;
          });
					
					scope.filterSpecials = function(unassigned, verified) {
						if(!verified) { verified = []; }
						return unassigned.filter(function(d) { return verified.indexOf(d) === -1; });
					}
				},

				post : function(scope, element, attrs) {
					scope.metadata = dataService.getMetadata();
					scope.files = dataService.getFiles();

					if(scope.displayIndex && scope.displayIndex !== 'all') {
						scope.files = [scope.files[scope.displayIndex]];
					}

					scope.maxRecords = d3.max(scope.files, function(d) { return d.data.length; });

					scope.files.forEach(scope.reparseFile);
					
					scope.sortFields = function(file) {
						file.fields.forEach(function(f) { scope.sortField(f, file); });
					}
					
					scope.sortField = function(field, file) {
						switch(file.sortMode) {
							case 'Map errors and gaps':
								field.sortedValues = file.data.map(function(d) {
									return d[field.key];
								}).map(function(d) {
									return {
										value: d,
										color: scope.colorCalc(d, 'error', field)
									};
								});
								break;
							case 'Map by data types':
								field.sortedValues = file.data.map(function(d) {
									return d[field.key];
								}).map(function(d) {
									return {
										value: d,
										color: scope.colorCalc(d, 'type', field)
									};
								});
								break;
							case 'Sort by values':
								field.sortedValues = file.data.map(function(d) {
									return d[field.key];
								}).map(function(d) {
									return {
										value: d,
										color: scope.colorCalc(d, 'type', field)
									};
								}).sort(function(a,b) { return a.color < b.color ? -1 : 1; });
								break;
						}
					}
					
					// Set up tooltips
					function setTooltips() {
						setTimeout(function() {
							addTooltips();
						}, 100);	
					}
					function addTooltips() {
						angular.element(element[0]).find('div.dimension-type').tooltip();
						angular.element(element[0]).find('i.source-type').tooltip();
					}
					function removeTooltips() {
						angular.element(element[0]).find('div.dimension-type').tooltip('destroy');
						angular.element(element[0]).find('i.source-type').tooltip('destroy');
					}
					setTooltips();
					
					scope.centerTable = function(ev) {
						// Do this async so that page can re-render first and table container can expand.
						function internalUpdate() {
							var tableNode = ev.currentTarget.parentNode.parentNode.parentNode;
							tableNode.parentNode.scrollLeft = tableNode.parentNode.scrollLeft - 30 + tableNode.getBoundingClientRect().left;
						}
						setTimeout(internalUpdate);
					};

					scope.calcPosition = function(file) {
						if($('.table-display')[scope.files.indexOf(file)].getBoundingClientRect().left < 0 &&
							$('.table-display')[scope.files.indexOf(file)].getBoundingClientRect().right > 500) {
							
							return 'absolute';
						}
						return 'relative';
					};

					$('#tables').scroll(function() { scope.$digest(); });

					scope.colorCalc = function(value, calcType, field) {
						if(calcType === 'error') {
							if(value === null || value === undefined || value === "") return scope.colors['null'];
              var possibleValues = sniffPossible(value);
							if(possibleValues.indexOf(field.detailType) === -1 &&
								!(possibleValues.indexOf('number') > -1 && (field.detailType === 'uniqueNumeric' || field.detailType === 'ordinalNumeric' )) &&
								!(possibleValues.indexOf('text') > -1 && (field.detailType === 'uniqueText' || field.detailType === 'nominalText')) &&
								!(possibleValues.indexOf('text') > -1 && field.detailType === 'uniqueText') &&
								!((value.length === 4 || value.length === 7) && field.detailType === 'date') &&
								field.detailType !== 'binary0' ) {

								return scope.colors.mismatch;
							}
							return '#bbbbbb';
						}
						if(calcType === 'edit') {
							var possibleValues = sniffPossible(value);
							if(possibleValues.indexOf(field.detailType) === -1 &&
								!(possibleValues.indexOf('number') > -1 && (field.detailType === 'uniqueNumeric' || field.detailType === 'ordinalNumeric' )) &&
								!(possibleValues.indexOf('text') > -1 && (field.detailType === 'uniqueText' || field.detailType === 'nominalText')) &&
								!(possibleValues.indexOf('text') > -1 && field.detailType === 'uniqueText') &&
								field.detailType !== 'binary0' ) {

								return scope.colors.mismatch;
							}
							return '#bbbbbb';
						}
						if(calcType === 'type') {
							if(field.detailType === 'ordinalNumeric' && sniff(value) === 'number') {
								return scope.colors['ordinalNumeric'];
							} else if (field.detailType === 'binary0' && field.uniqueValues && (value === field.uniqueValues[0] || value === field.uniqueValues[1])) {
								return value === field.uniqueValues[0] ? scope.colors['binary0'] : scope.colors['binary1'];
							} else if ( (field.detailType === 'ordinalNumeric' || field.detailType === 'nominalText') && value && field.uniqueValues.indexOf(value.split(field.mvDelimiter)[0]) !== -1) {
								return scope.colors[field.detailType];
							} else {
								return scope.colors[sniff(value)];	
							}
						}
					};
					
					scope.assignIndexAndFile = function(file, index) {
						 file.editIndex = index;
						 scope.fileForArrowIndexChange = file;
					}
					
					$document.keydown(function(ev) {
						scope.$apply(function(s) {
							if(ev.keyCode === 27) { s.files.forEach(function(f) { f.editIndex = null; }); }
							if(ev.keyCode === 37 && scope.fileForArrowIndexChange && scope.fileForArrowIndexChange.editIndex > 0) {
								ev.preventDefault();
								scope.fileForArrowIndexChange.editIndex--;
							}
							if(ev.keyCode === 39 && scope.fileForArrowIndexChange && scope.fileForArrowIndexChange.editIndex < scope.fileForArrowIndexChange.data.length-1) {
								ev.preventDefault();
								scope.fileForArrowIndexChange.editIndex++;
							}
						})
					});

					scope.numberWithValue = function(file, field) {
						return file.data.filter(function(d) { return d[field.key] !== null && d[field.key] !== undefined && d[field.key] !== ""; }).length;
					};

					var isBoolean = function(value) {
						return typeof value == 'boolean';
					};

					var isString = function(value){
						return typeof value == 'string';
					};

					var isArray = function(value){
            if(value && value.toString) return value.toString() == '[object Array]';
            return false;
					};

					var isNumber = function(value){
						return typeof value == 'number' || RegExp('^\\d*$').test(value);
					};

					var isObject = function(value){
						return value !== null && typeof value == 'object';
					};

					var isDate = function(value){
						return value.toString() == '[object Date]';
					};

					var isFunction = function(value){
						return typeof value == 'function';
					};

					var isBooleanLike = function(value){
						if (value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === 1 ) return true;
						if (value.toLowerCase() === 'false' || value.toLowerCase() === 'no' || value === 0 ) return true;
						return false;
					};

					var isNumberLike = function(value) {
						if(value && value.replace) return !isNaN(value.replace(',','.'));
            return false;
					};

					var isDateLike = function(value){
						// We allow zero-dates (1999-00-00) even though they aren't technically valid.
						// We allow negative years in dates
						var dateTest = RegExp('^[-]\\d\\d\\d\\d($)|([-](0[0-9]|1[012]|[0-9])[-](0[0-9]|[12][0-9]|3[01]|[0-9])$)');
						if(dateTest.test(value)) return true;
						return false;
					};

					var isLatLonLike = function(value){
            if(value) {
              var pieces = value.split(',');
              if (pieces.length !== 2) return false;
              if (isNumberLike(pieces[0]) && isNumberLike(pieces[1])) return true; 
            }
						return false;
					};

					var isUrlLike = function(value){
						if(value && value.indexOf) if ( value.indexOf("https://") === 0 || value.indexOf("http://") === 0 || value.indexOf("www.") === 0 ) return true;
						return false;
					};

					var sniff = function(value) {
						if (typeof value === 'undefined' || value === null || value.length === 0) return 'null';
						if (isObject(value)) return 'object';
						if (isArray(value)) return 'array';
						if (isNumber(value) && value.length === 4) { return 'YYYY'; }
						if (isNumber(value)) return 'number';
						// String
						if (isUrlLike(value)) return 'url';
						//if (isBooleanLike(value)) return 'boolean';
						if (isDateLike(value) && value.length === 4) return 'YYYY';
						if (isDateLike(value) && value.length === 7) return 'YYYYMM';
						// if (isDateLike(value) && value.length === 10) return 'YYYYMMDD';
						if (isDateLike(value)) return 'date';
						if (isNumberLike(value)) return 'number';
						if (isLatLonLike(value)) return 'latlong';
						if (isString(value)) return 'text';
						return null;
					};
          
          var sniffPossible = function(value) {
            var arr = [];
            if (isObject(value)) arr.push('object');
						if (isArray(value)) arr.push('array');
						if (isNumber(value) && value.length === 4) { arr.push('YYYY'); }
						if (isNumber(value)) arr.push('number');
						// String
						if (isUrlLike(value)) arr.push('url');
						//if (isBooleanLike(value)) return 'boolean';
						if (isDateLike(value) && value.length === 4) arr.push('YYYY');
						if (isDateLike(value) && value.length === 7) arr.push('YYYYMM');
						// if (isDateLike(value) && value.length === 10) return 'YYYYMMDD';
						if (isDateLike(value)) arr.push('date');
						if (isNumberLike(value)) arr.push('number');
						if (isLatLonLike(value)) arr.push('latlong');
						if (isString(value)) arr.push('text');
            return arr;
          }
					
					scope.updateMetadata = function() {
						scope.reparseUniques(scope.selectedFieldMetadata, scope.selectedFile);
            scope.sortField(scope.selectedFieldMetadata, scope.selectedFile);
						removeTooltips();
						setTooltips();
					}
					
					scope.updateUniques = scope.updateMetadata;
					
					scope.addFile =  function(text, fileName){
	
						// if no text return
						if (!text || !text.length) return;
						scope.parseError = false;
						// let's see if the text is a URL.
						if (text.indexOf("http") === 0 && text.indexOf("\n") === -1) {
							try {
								parseService.parseUrl(text).then(
									function(csv){
										var url = text;
										var data = parseService.parseText(csv);
										dataService.addFile(data, "From URL", url);
										scope.reparseFile(dataService.getFiles()[dataService.getFiles().length-1]);
										setTooltips();
									},
									function(error){
										scope.parseError = error;
									});
							} catch(error) {
								scope.parseError = error.message;
							}
							return;
						}
	
						try {
							var data = JSON.parse(text);
	
							dataService.addFile(data, scope.lastFileName);
							scope.lastFileName = null;
							scope.reparseFile(dataService.getFiles()[dataService.getFiles().length-1]);
							return;
						} catch(error) {
							try {
								var data = parseService.parseText(text);
								
								dataService.addFile(data, scope.lastFileName);
								scope.lastFileName = null;
								scope.reparseFile(dataService.getFiles()[dataService.getFiles().length-1]);
							} catch(error) {
								scope.parseError = error.message;
							}
						}
						setTooltips();
					};
				}
			}
		};
	});

angular.module('palladio').run(['$templateCache', function($templateCache) {
    $templateCache.put('partials/palladio-metavis-component/template.html',
        "<div id=\"main\">\n\t<div id=\"table-histograms\" data-ng-if=\"displayOverview\" class=\"center-block container-fluid\">\n\t\t<div class=\"table-histogram row\" ng-repeat=\"file in files\">\n\t\t\t<div class=\"col-md-2\">\n\t\t\t\t<span class=\"pull-right\" ng-click=\"file.reviewMode = !file.reviewMode;\">{{file.label}}</span>\n\t\t\t</div>\n\t\t\t<div class=\"col-md-8\">\n\t\t\t\t<div \n\t\t\t\t\tstyle=\"width: {{85 * file.data.length / maxRecords}}%; background-color: #D3D3D3; height: 10px; margin-top: 5px; display: inline-block\"\n\t\t\t\t\tng-click=\"file.reviewMode = !file.reviewMode;\">\n\t\t\t\t</div>\n\t\t\t\t<span style=\"font-weight: lighter; font-size: smaller\"\n\t\t\t\t\tng-click=\"file.reviewMode = !file.reviewMode;\">\n\t\t\t\t\t\n\t\t\t\t\t{{file.data.length}} records\n\t\t\t\t</span>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"clearfix\" style=\"height:50px\"></div>\n\t<div id=\"tables\" data-ng-if=\"displayTables\"\n\t\t\tstyle=\"overflow-x:scroll; white-space: nowrap; margin-bottom: 2px; height: 100%; padding-left: 30px\">\n\t\t<div class=\"table-display\" ng-repeat=\"file in files\"\n\t\t\tstyle=\"vertical-align:top; margin-right: 30px;\"\n\t\t\tng-init=\"sortModes=['Map errors and gaps','Map by data types','Sort by values']; file.sortMode = sortModes[0]; sortFields(file); file.displayType = displayTypes; file.reviewMode = expanded;\">\n\t\t\t<div class=\"table-header pull-left\" style=\"margin-bottom: 7px; overflow:hidden; white-space: nowrap; display: inline-block; clear: both;\">\n\t\t\t\t<span class=\"labels\" style=\"width:263px; display:inline-block\">\n\t\t\t\t\t<!--<span class=\"table-label\" style=\"font-weight: strong; font-size: larger\">{{file.label}}</span>-->\n\t\t\t\t\t<input tooltip-animation=\"false\" tooltip-append-to-body=\"true\" tooltip=\"Rename\" data-container=\"body\"\n\t\t\t\t\t\tdata-placement=\"top\" type=\"text\" class=\"form-control editable ng-pristine ng-untouched ng-valid table-label\"\n\t\t\t\t\t\tng-model=\"file.label\" placeholder=\"Untitled\" ng-disabled=\"!modifiable\">\n\t\t\t\t\t<span class=\"review-label\" data-ng-if=\"displayReview\"\n\t\t\t\t\t\tstyle=\"font-weight: strong; font-size: larger; color: #EC5D57;\"\n\t\t\t\t\t\tng-click=\"file.reviewMode = !file.reviewMode; centerTable($event);\">review</span>\n\t\t\t\t</span>\n\t\t\t\t<span style=\"width: 35px; padding: 5px; display:inline-block;\">\n\t\t\t\t\t<input type=\"checkbox\" \n\t\t\t\t\t\tng-model=\"file.displayType\"\n\t\t\t\t\t\tstyle=\"height: 16px; width: 16px; margin-top:0px;\">\n\t\t\t\t\t</input>\n\t\t\t\t</span>\n\t\t\t\t<span ng-show=\"file.reviewMode\">\n\t\t\t\t\t<span ng-repeat=\"mode in sortModes\" style=\"margin-left: 10px; margin-right: 10px\"\n\t\t\t\t\t\tng-style=\"{ 'color': mode === file.sortMode ? '#bbbbbb' : '#68ABE5' }\"\n\t\t\t\t\t\tng-click=\"file.sortMode = mode; file.sortMode === sortModes[2] ? file.editIndex = null : null; sortFields(file);\">\n\t\t\t\t\t\t{{mode}}\n\t\t\t\t\t</span>\n\t\t\t\t</span>\n\t\t\t</div>\n\t\t\t<div class=\"dimension pull-left\" ng-repeat=\"field in file.fields\"\n\t\t\t\tstyle=\"overflow:hidden; white-space: nowrap; margin-bottom: 2px; height: 35px; display: inline-block; clear: both; left: -30px;\">\n\t\t\t\t<div style=\"height: 35px; width: 300px; display: inline-block; left: 0px;\">\n\t\t\t\t\t<div class=\"dimension-main\" style=\"height: 35px; width: 263px; background-color: #eeeeee; padding: 5px; font-weight: lighter; display: inline-block;\"\n\t\t\t\t\t\tng-click=\"assignSelectedFieldandFile(field, file)\">\n            <div style=\"left: 5px; overflow: visible; width: 263px;\">\n              <i class=\"source-type fa pull-left\" style=\"margin-top:6px; margin-right: 7px; min-width:12px;\"\n                  ng-class=\"{ 'fa-circle': field.sourceType === 'authored', 'fa-dot-circle-o': field.sourceType === 'curated', 'fa-circle-o': field.sourceType === 'source' }\"\n                  data-toggle=\"tooltip\" data-placement=\"right\" title=\"{{sourceTexts[field.sourceType] ? sourceTexts[field.sourceType] : 'No source information provided'}}\"></i>\n              <div style=\"padding-left: 5px; padding-right: 5px; border-radius: 4px; background-color: #eeeeee;\" ng-style=\"{ position: calcPosition(file) }\">\n                <span class=\"pull-left field-description\">{{field.description}}{{field.mvDelimiter ? ' (M)' : ''}}</span>\n              </div>\n            </div>\n\t\t\t\t\t\t<span class=\"dimension-specials pull-right\" data-ng-if=\"displayPills\">\n\t\t\t\t\t\t\t<div class=\"special-character\" ng-repeat=\"special in field.special\"\n\t\t\t\t\t\t\t\tstyle=\"color: #FFFFFF; height: 25px; width: 25px; display: inline-block; margin-right: 2px; text-align: center; font-size: larger; font-weight: strong; border-radius: 4px;\"\n\t\t\t\t\t\t\t\tng-style=\"{ 'background-color': filterSpecials(field.unassignedSpecialChars, field.verifiedSpecialChars).indexOf(special) === -1 ? '#bbbbbb' : '#EC5D57' }\"\n\t\t\t\t\t\t\t\tng-click=\"field.verifiedSpecialChars.push(special); $event.stopPropagation()\">\n\t\t\t\t\t\t\t\t{{special}}\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</span>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div style=\"width: 35px; height:35px; display: inline-block; margin-left: -2px; padding: 5px\";\n\t\t\t\t\t\tng-style=\"{ 'background-color' : file.displayType ? colors[field.detailType] : '#eeeeee' }\"\n\t\t\t\t\t\tdata-toggle=\"tooltip\" data-placement=\"top\" title=\"{{typeTexts[field.detailType] ? typeTexts[field.detailType] : 'not found'}}\"\n\t\t\t\t\t\tclass=\"dimension-type\">\n\t\t\t\t\t\t<span ng-hide=\"!file.reviewMode\" class=\"pull-left\"\n\t\t\t\t\t\t\tstyle=\"width: 25px; font-weight: lighter; text-align: center;\"\n\t\t\t\t\t\t\tng-style=\"{ color: file.displayType ? textColors[field.detailType] : '#444444', 'font-size': numberWithValue(file, field)>999 ? (numberWithValue(file, field)>9999 ? '10px' : '11.5px') : 'inherit', 'margin-top': numberWithValue(file, field)>999 ? '4px' : '3px' }\">\n\t\t\t\t\t\t\t{{numberWithValue(file, field)}}\n\t\t\t\t\t\t</span>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div style=\"height: 35px; display: inline-block; margin-left: -2px\"\n\t\t\t\t\t\tng-show=\"file.reviewMode\">\n\t\t\t\t\t<span ng-show=\"file.editIndex !== null && file.editIndex !== undefined\"\n\t\t\t\t\t\tstyle=\"height: 35px; display: inline-block; width: 200px; position: relative; float: left;\"\n\t\t\t\t\t\tng-style=\"{ left: file.editIndex*4 }\">\n\t\t\t\t\t\t<input type=\"text\" ng-model=\"file.data[file.editIndex][field.key]\"\n\t\t\t\t\t\t\tstyle=\"width:200px; margin:0px; height: 35px;\"\n\t\t\t\t\t\t\tng-disabled = \"!modifiable\"\n\t\t\t\t\t\t\tng-focus=\"clearArrowEffect()\"\n\t\t\t\t\t\t\tng-change=\"field.sortedValues[file.editIndex].color = colorCalc(file.data[file.editIndex][field.key], file.sortMode === sortModes[0] ? 'edit' : 'type', field)\"\n\t\t\t\t\t\t\tng-style=\"{ 'color': colorCalc(file.data[file.editIndex][field.key], file.sortMode === sortModes[0] ? 'edit' : 'type', field) }\"></input>\n\t\t\t\t\t</span>\n\t\t\t\t\t<div style=\"height:35px; display: inline-block; background-color: #eeeeee\"\n\t\t\t\t\t\tng-style=\"{ 'margin-left': file.editIndex !== null && file.editIndex !== undefined ? '-200px' : '0px' }\">\n\t\t\t\t\t\t<div ng-repeat=\"obj in field.sortedValues\"\n\t\t\t\t\t\t\tstyle=\"height: 35px; margin-right: 1px; display: inline-block;\"\n\t\t\t\t\t\t\tng-style=\"{ width: $index === file.editIndex ? '200px' : 3 + 'px', 'background-color': $index === file.editIndex ? 'white' : obj.color }\"\n\t\t\t\t\t\t\tng-click=\"file.sortMode !== sortModes[2] ? assignIndexAndFile(file, $index) : null\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div\n\t\t\t\tdata-ng-if=\"displayDownload\"\n\t\t\t\tclass=\"pull-left\"\n\t\t\t\tstyle=\"display: inline-block; margin-top: 3px; margin-left: 5px; clear: left;\"\n\t\t\t\ttooltip-append-to-body=\"true\"\n\t\t\t\ttooltip=\"Download as .csv\"\n\t\t\t\ttooltip-placement=\"right\"\n\t\t\t\tdata-ng-click=\"downloadFile(file)\">\n\t\t\t\t\t<i class=\"fa fa-download\"></i>\n\t\t\t</div>\n\t\t\t<div class=\"pull-left\" data-ng-if=\"modifiable\"\n\t\t\t\tstyle=\"font-size: smaller; color: #EC5D57; margin-top: 5px; margin-left: 5px; height: 35px; display: inline-block;\"\n\t\t\t\tng-click=\"files.splice($index, 1)\">\n\t\t\t\t\n\t\t\t\tRemove file\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div style=\"padding-left: 30px\" data-ng-if=\"modifiable\">\n\t\t<!-- Button trigger add file modal -->\n\t\t<button type=\"button\" class=\"btn btn-primary btn-lg\" data-toggle=\"modal\" data-target=\"#addFileModal\">\n\t\t\tAdd file\n\t\t</button>\n\t\t<div palladio-data-download data-ng-show=\"files.length\" style=\"display:inline-block\">\n\t\t\tDownload Palladio save file\n\t\t</div>\n\t</div>\n</div>\n\n<!-- Add File Modal -->\n<div class=\"modal fade\" id=\"addFileModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"addFileModalLabel\">\n  <div class=\"modal-dialog modal-lg\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n        <h4 class=\"modal-title\" id=\"addFileModalLabel\">Add File</h4>\n      </div>\n      <div class=\"modal-body\">\n        <textarea ui-refresh=\"\" ui-codemirror=\"{ mode : 'text', lineNumbers : true, lineWrapping: true, onLoad : codemirrorLoaded }\" placeholder=\"Paste your data or drop a file here\" ng-model=\"text\"></textarea>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-click=\"text = null\">Close</button>\n        <button type=\"button\" class=\"btn btn-primary\" ng-click=\"addFile(text); text = null\" data-dismiss=\"modal\">Add file</button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Dimension edit modal -->\n\n<div class=\"modal\" id=\"{{editModalId}}\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"dimensionEditModalLabel\" aria-hidden=\"true\">\n\t<div class=\"modal-dialog modal-lg\">\n\t\t<div class=\"modal-content\">\n\t\t\t<!-- Modal Header -->\n\t\t\t<div class=\"modal-header\">\n\t\t\t\t<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n\t\t\t\t<span>Edit dimension</span>\n\t\t\t</div>\n\n\t\t\t<!-- Modal Body -->\n\t\t\t<div class=\"modal-body\">\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"row margin-bottom\">\n\t\t\t\t\t\t<div class=\"col-lg-2 col-md-2 col-sm-4 col-xs-4 text-right\">\n\t\t\t\t\t\t\t<label class=\"inline\">Title</label>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"col-lg-10 col-md-10 col-sm-8 col-xs-8 col-condensed\">\n\t\t\t\t\t\t\t<div class=\"row margin-bottom\">\n\t\t\t\t\t\t\t\t\t<div class=\"col-lg-8 col-md-8 col-sm-12 col-xs-12\">\n\t\t\t\t\t\t\t\t\t\t<input\n\t\t\t\t\t\t\t\t\t\t\tdata-toggle=\"tooltip\"\n\t\t\t\t\t\t\t\t\t\t\tdata-original-title=\"Rename\"\n\t\t\t\t\t\t\t\t\t\t\ttype=\"text\"\n\t\t\t\t\t\t\t\t\t\t\trequired\n\t\t\t\t\t\t\t\t\t\t\tclass=\"form-control\"\n\t\t\t\t\t\t\t\t\t\t\tdata-ng-model=\"selectedFieldMetadata.description\" placeholder=\"Untitled\"></input>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t\t<div class=\"col-lg-4 col-md-4 col-sm-12 col-xs-12\">\n\t\t\t\t\t\t\t\t\t\t<label>Source <i class=\"fa fa-question-circle hint\" popover-trigger=\"mouseenter\" popover=\"Choose a description of the source or authorship of data in this column.\"></i></label>\n\t\t\t\t\t\t\t\t\t\t<ui-select ng-model=\"selectedFieldMetadata.sourceType\" theme=\"selectize\" append-to-body=\"true\">\n\t\t\t\t\t\t\t\t\t\t\t<ui-select-match placeholder=\"Select\" allow-clear=\"true\">\n\t\t\t\t\t\t\t\t\t\t\t\t{{$select.selected.displayKey}}\n\t\t\t\t\t\t\t\t\t\t\t\t<span class=\"caret\"></span>\n\t\t\t\t\t\t\t\t\t\t\t</ui-select-match>\n\t\t\t\t\t\t\t\t\t\t\t<ui-select-choices repeat=\"type.key as type in sourceTextArray | filter: {key:$select.search}\">\n\t\t\t\t\t\t\t\t\t\t\t\t<span ng-bind-html=\"type.displayKey | highlight: $select.search\"></span><br/>\n\t\t\t\t\t\t\t\t\t\t\t\t<span class=\"text-muted\" ng-bind-html=\"type.value\"></span>\n\t\t\t\t\t\t\t\t\t\t\t</ui-select-choices>\n\t\t\t\t\t\t\t\t\t\t</ui-select>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\n\t\n\t\t\t\t\t<div class=\"row margin-top\">\n\t\t\t\t\t\t<div class=\"col-lg-2 col-md-2 col-sm-4 col-xs-4 text-right\">\n\t\t\t\t\t\t\t<label class=\"inline\">Data type</label>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-8 col-condensed\">\n\t\n\t\t\t\t\t\t\t<ui-select ng-model=\"selectedFieldMetadata.detailType\" theme=\"selectize\" ng-disabled=\"disabled\" on-select=\"updateMetadata()\" append-to-body=\"true\">\n\t\t\t\t\t\t\t\t<ui-select-match placeholder=\"Select or search\">\n\t\t\t\t\t\t\t\t\t{{$select.selected.name}}\n\t\t\t\t\t\t\t\t\t<span class=\"caret\"></span>\n\t\t\t\t\t\t\t\t</ui-select-match>\n\t\t\t\t\t\t\t\t<ui-select-choices repeat=\"type.id as type in allowedTypes | filter: {name:$select.search}\">\n\t\t\t\t\t\t\t\t\t<span ng-bind-html=\"type.name | highlight: $select.search\"></span><br/>\n\t\t\t\t\t\t\t\t\t<span class=\"text-muted\" ng-bind-html=\"type.description\"></span>\n\t\t\t\t\t\t\t\t</ui-select-choices>\n\t\t\t\t\t\t\t</ui-select>\n\t\n\t\t\t\t\t\t\t<p class=\"help-block\" data-ng-show=\"selectedFieldMetadata.errors.length\">{{selectedFieldMetadata.errors.length}} unique values do not match this data type!</p>\n\t\t\t\t\t\t\t<p class=\"help-block\" data-ng-hide=\"selectedFieldMetadata.errors.length\">All the values match this type.</p>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\n\t\n\t\t\t\t\t<div class=\"row\">\n\t\n\t\t\t\t\t\t<div class=\"col-lg-2 col-md-2 col-sm-4 col-xs-4 text-right\">\n\t\t\t\t\t\t\t<label class=\"inline\">Unique values</label>\n\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t\t<div class=\"col-lg-10 col-md-10 col-sm-8 col-xs-8 col-condensed\">\n\t\n\t\t\t\t\t\t\t<div class=\"row margin-bottom\">\n\t\n\t\t\t\t\t\t\t\t<div class=\"col-lg-8 col-md-8 col-sm-12 col-xs-12\">\n\t\n\t\t\t\t\t\t\t\t\t<div class=\"row\">\n\t\n\t\t\t\t\t\t\t\t\t\t<div class=\"col-lg-5 col-md-6 col-sm-6 margin-bottom\">\n\t\t\t\t\t\t\t\t\t\t\t<input type=\"text\" class=\"form-control\" ng-model=\"searchUnique.key\" placeholder=\"Search\"></input>\n\t\t\t\t\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t\t\t\t\t\t<div class=\"col-lg-5 col-lg-offset-2 col-md-6 col-sm-6\">\n\t\n\t\t\t\t\t\t\t\t\t\t\t<ui-select class=\"pull-right\" ng-model=\"displayOptions.sortBy\" theme=\"selectize\" ng-disabled=\"disabled\" on-select=\"updateMetadata()\">\n\t\t\t\t\t\t\t\t\t\t\t\t<ui-select-match placeholder=\"Select\">\n\t\t\t\t\t\t\t\t\t\t\t\t\t<!--<i class=\"fa margin-right\" ng-class=\"$select.selected.icon\"></i>-->\n\t\t\t\t\t\t\t\t\t\t\t\t\t{{$select.selected.label}}\n\t\t\t\t\t\t\t\t\t\t\t\t\t<span class=\"caret\"></span>\n\t\t\t\t\t\t\t\t\t\t\t\t</ui-select-match>\n\t\t\t\t\t\t\t\t\t\t\t\t<ui-select-choices repeat=\"type in sortOptions | filter: {label:$select.search}\">\n\t\t\t\t\t\t\t\t\t\t\t\t\t<span ng-bind-html=\"type.label | highlight: $select.search\"></span><br/>\n\t\t\t\t\t\t\t\t\t\t\t\t</ui-select-choices>\n\t\t\t\t\t\t\t\t\t\t\t</ui-select>\n\t\n\t\t\t\t\t\t\t\t\t\t\t<div class=\"clearfix\"></div>\n\t\n\t\t\t\t\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t\t\t\t\t<div class=\"unique-values margin-bottom\">\n\t\t\t\t\t\t\t\t\t\t<table\n\t\t\t\t\t\t\t\t\t\t\tclass=\"table table-striped\"\n\t\t\t\t\t\t\t\t\t\t\tdata-ng-show=\"!filtered || (filtered && filtered.length > 0)\">\n\t\t\t\t\t\t\t\t\t\t\t<tr data-ng-repeat=\"val in filtered = (selectedFieldMetadata.uniques | filter:searchUnique | orderBy: sortOrder) | limitTo:1000\">\n\t\t\t\t\t\t\t\t\t\t\t\t\t<td\n\t\t\t\t\t\t\t\t\t\t\t\t\t\tdata-ng-class=\"{ 'text-danger': findError(val.key) }\"\n\t\t\t\t\t\t\t\t\t\t\t\t\t\ttitle=\"{{findError(val.key).message}}\"\n\t\t\t\t\t\t\t\t\t\t\t\t\t\tdata-ng-bind-html=\"displayVal(val)\">\n\t\t\t\t\t\t\t\t\t\t\t\t</td>\n\t\t\t\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t\t\t</table>\n\t\t\t\t\t\t\t\t\t\t<div class=\"padding-all text-danger small\" data-ng-show=\"filtered && filtered.length == 0\">No values found</div>\n\t\t\t\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t\t\t\t\t<p class=\"help-block\"><strong>{{filtered.length}}</strong> values displayed.</p>\n\t\n\t\t\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t\t\t\t<div class=\"col-lg-4 col-md-4 col-sm-12 col-xs-12\">\n\t\n\t\t\t\t\t\t\t\t\t<!--<div ng-show=\"selectedFieldMetadata.unassignedSpecialChars.length\">\n\t\t\t\t\t\t\t\t\t\t<span class=\"help-block\">Some of the values in this dimension contain the following special characters. If you want to use them as delimiter, type them into the forms below.</span>\n\t\t\t\t\t\t\t\t\t\t<div specials></div>\n\t\t\t\t\t\t\t\t\t</div>-->\n\t\n\t\t\t\t\t\t\t\t\t<div class=\"margin-bottom\" ng-show=\"selectedFieldMetadata.unassignedSpecialChars.length\">\n\t\t\t\t\t\t\t\t\t\t<label>\n\t\t\t\t\t\t\t\t\t\t\t<span data-ng-class=\"{ 'text-danger': selectedFieldMetadata.unassignedSpecialChars.length !==  selectedFieldMetadata.verifiedSpecialChars.length}\">\n\t\t\t\t\t\t\t\t\t\t\t\tVerify special characters\n\t\t\t\t\t\t\t\t\t\t\t</span> <i class=\"fa fa-question-circle hint\" popover-trigger=\"mouseenter\" popover=\"Special characters may be errors or multiple-value delimiters.\"></i></label>\n\t\t\t\t\t\t\t\t\t\t<div specials></div>\n\t\t\t\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t\t\t\t\t<label>Multiple values <i class=\"fa fa-question-circle hint\" popover-trigger=\"mouseenter\" popover=\"Field contains multiple values that are split by this character.\"></i></label>\n\t\t\t\t\t\t\t\t\t<input type=\"text\" id=\"val-delimiter\" class=\"form-control\"\n\t\t\t\t\t\t\t\t\t\tdata-ng-model=\"selectedFieldMetadata.mvDelimiter\"\n\t\t\t\t\t\t\t\t\t\tdata-ng-change=\"updateMetadata()\"/>\n\t\t\t\t\t\t\t\t\t<span class=\"help-block\">If the dimension contains multiple values, insert the delimiter string above</span>\n\t\t\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t\t\t</div>\n\t\n\t\n\t\n\t\t\t\t\t\t</div>\n\t\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\n\t\t\t<!-- Modal Footer -->\n\t\t\t<div class=\"modal-footer\">\n\t\t\t\t<button data-ng-show=\"selectedFieldMetadata.unassignedSpecialChars.length === selectedFieldMetadata.verifiedSpecialChars.length\" type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-click=\"hideNewTable()\"><i class=\"fa fa-check margin-right text-primary\"></i>Done</button>\n\t\t\t\t<button data-ng-show=\"selectedFieldMetadata.unassignedSpecialChars.length !== selectedFieldMetadata.verifiedSpecialChars.length\" type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-click=\"hideNewTable()\">Close</button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>");
}]);