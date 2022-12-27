function createMapDefaults_(fields) {
  let fieldMap = new Map()
  fields.forEach(f => fieldMap.set(f, 0))
  return fieldMap
}

function checkWebsiteConfiguration_(website, propertyId) {
  if (!website || !propertyId) {
    throw `Configuration is incomplete, website '${website}'', property id '${viewID}'`
  }
}

String.prototype.capitalize = function(s)
{
  return s.slice(0,1).toUpperCase() + s.slice(1,s.length)
}

Map.prototype.stringify = function()
{
  const obj = {}
  for (let [k,v] of this)
    obj[k] = v

  return JSON.stringify(obj);
}

