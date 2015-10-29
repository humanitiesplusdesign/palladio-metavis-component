angular.module('palladioMetavis', ['palladio', 'palladio.services'])
	.run(['componentService', function(componentService) {
		var compileStringFunction = function (newScope, options) {
			var compileString = '<div data-palladio-metavis></div>';
			return compileString;
		};

		componentService.register('metavis', compileStringFunction);
	}])
	.directive('palladioMetavis', function (palladioService, dataService) {
		return {
			scope : true,
			templateUrl : '../template.html',
			link : {
				pre : function(scope, element) { },

				post : function(scope, element, attrs) {
					scope.metadata = dataService.getMetadata();
					scope.files = dataService.getFiles();
					scope.links = dataService.getLinks();
					scope.maxRecords = d3.max(scope.files, function(d) { return d.data.length; });

					scope.files.forEach(function(d) {
						d.fields.forEach(function(f) {
							if(f.uniqueKey && f.type === "number") {
								f.type = 'uniqueNumeric';
							}
							if(f.uniqueKey && f.type === "text") {
								f.type = 'uniqueText';
							}
							if(f.uniques.length === 2) {
								f.type = 'binary0';
							}
							if(f.uniques.length > 2 && f.uniques.length < 10 && f.type === 'number') {
								f.type = 'ordinalNumeric';
							}
							if(f.uniques.length > 2 && f.uniques.length < 10 && f.type === 'text') {
								f.type = 'nominalText';
							}
						});
					});

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
						'null': '#FFFFFF',
						mismatch: '#EC5D57'
					};

					scope.centerTable = function(ev) {
						// Do this async so that page can re-render first and table container can expand.
						function internalUpdate() {
							var tableNode = ev.currentTarget.parentNode.parentNode.parentNode;
							tableNode.parentNode.scrollLeft = tableNode.parentNode.scrollLeft - 30 + tableNode.getBoundingClientRect().left;
						}
						setTimeout(internalUpdate);	
					}

					scope.colorCalc = function(value, calcType, fieldType) {
						if(calcType === 'error') {
							if(value === null || value === undefined || value === "") return scope.colors['null'];
							if(sniff(value) !== fieldType &&
								!(sniff(value) === 'number' && (fieldType === 'uniqueNumeric' || fieldType === 'ordinalNumeric' )) &&
								!(sniff(value) === 'text' && (fieldType === 'uniqueText' || fieldType === 'nominalText')) &&
								!(sniff(value) === 'text' && fieldType === 'uniqueText') &&
								!((value.length === 4 || value.length === 7) && fieldType === 'date') &&
								fieldType !== 'binary0' ) {

								return scope.colors.mismatch;
							}
							return '#bbbbbb';
						}
						if(calcType === 'edit') {
							if(sniff(value) !== fieldType &&
								!(sniff(value) === 'number' && (fieldType === 'uniqueNumeric' || fieldType === 'ordinalNumeric' )) &&
								!(sniff(value) === 'text' && (fieldType === 'uniqueText' || fieldType === 'nominalText')) &&
								!(sniff(value) === 'text' && fieldType === 'uniqueText') &&
								fieldType !== 'binary0' ) {

								return scope.colors.mismatch;
							}
							return '#bbbbbb';
						}
					};

					scope.numberWithValue = function(file, field) {
						return file.data.filter(function(d) { return d[field.key] !== null && d[field.key] !== undefined && d[field.key] !== "" }).length;
					}

					var isBoolean = function(value) {
						return typeof value == 'boolean';
					};

					var isString = function(value){
						return typeof value == 'string';
					};

					var isArray = function(value){
						return value.toString() == '[object Array]';
					};

					var isNumber = function(value){
						return typeof value == 'number'; //|| !isNaN(parseFloat(value));
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
						return !isNaN(value.replace(',','.'));
					};

					var isDateLike = function(value){
						// We allow zero-dates (1999-00-00) even though they aren't technically valid.
						// We allow negative years in dates
						var dateTest = RegExp('^[-]\\d\\d\\d\\d($)|([-](0[0-9]|1[012]|[0-9])[-](0[0-9]|[12][0-9]|3[01]|[0-9])$)');
						if(dateTest.test(value)) return true;
						return false;
					};

					var isLatLonLike = function(value){
						var pieces = value.split(',');
						if (pieces.length !== 2) return false;
						if (isNumberLike(pieces[0]) && isNumberLike(pieces[1])) return true;
						return false;
					};

					var isUrlLike = function(value){
						if ( value.indexOf("https://") === 0 || value.indexOf("http://") === 0 || value.indexOf("www.") === 0 ) return true;
						return false;
					};

					var sniff = function(value) {
						if (typeof value === 'undefined' || value === null || value.length === 0) return 'null';
						if (isObject(value)) return 'object';
						if (isArray(value)) return 'array';
						if (isNumber(value)) return 'number';
						// String
						if (isUrlLike(value)) return 'url';
						//if (isBooleanLike(value)) return 'boolean';
						if (isDateLike(value)) return 'date';
						if (isNumberLike(value)) return 'number';
						if (isLatLonLike(value)) return 'latlong';
						if (isString(value)) return 'text';
						return null;
					};

					console.log(scope.files);
				}
			}
		};
	});
