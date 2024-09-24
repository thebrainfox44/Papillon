function extractNames (text) {
  const pattern = /\b([A-Z]+)\s+([A-Z][a-z]+)\b/g;
  const matches = [...text.matchAll(pattern)];
  return matches.map(match => `${match[1]} ${match[2]}`);
}

export const reduceIcalToCourse = (course, identityProvider, url) => {
  let returnCourse = {
    subject: course.summary?.value || "",
    id: course.uid?.value || "",
    type: "lesson",
    title: course.summary?.value || null,
    startTimestamp: course.dtstart && new Date(course.dtstart?.value).getTime() || null,
    endTimestamp: course.dtend && new Date(course.dtend?.value).getTime() || null,
    room: course.location?.value || null,
    teacher: course.organizer?.value || null,
    backgroundColor: null,
    itemType: null,
    status: null,
    source: "ical://"+url,
  };

  switch (identityProvider.identifier) {
    case "univ-rennes1":
      const teacher = extractNames(course.description?.value) || null;

      // get ressource
      const ressourceRegex = /(R\d{3})\s?-/;
      const ressource = course.summary?.value.match(ressourceRegex);

      // Get if CM, TD, TP
      const courseType = course.summary?.value.match(/(CM|TD|TP|DS)/);
      const courseTypes = {
        CM: "Cours Magistral",
        TD: "Travaux Dirigés",
        TP: "Travaux Pratiques",
        DS: "Devoir Surveillé",
      };

      const itemType = (ressource ? ressource[0].replace("-","") + " - " : "") + (courseType ? courseTypes[courseType[0]] : "");

      // class
      const classRegex = /\b[A-Za-z]{2}\s\d[A-Za-z](?:\d)?\s[A-Za-z]+\b/g;
      const classes = course.summary?.value.match(classRegex);

      const cmRegex = /\bCM\s+\w+\b/g;
      const cm = course.summary?.value.match(cmRegex);

      // remove ressource from title
      let title = course.summary?.value;
      if (ressource) {
        title = title.replace(ressource[0], "");
        // remove class
        title = title.replace(classRegex, "");
        // remove CM
        title = title.replace(cmRegex, "");
      }

      returnCourse = {
        ...returnCourse,
        title: title,
        subject: title,
        itemType: itemType,
        teacher,
      };
  }

  return returnCourse;
};