import { JsonParsing, ParsingOptions } from "gedcom.json";
import _ from "lodash";

interface IndividualInFamily {
  individual_id: string;
  names: string[];
}

interface FamilyPosition {
  name: string;
  individuals: IndividualInFamily[];
}

interface Family {
  family_id: string;
  family_name: string;
  positions: FamilyPosition[];
  descriptions: string[];
}

interface FamilyInIndividual extends Family {
  position_of_individual: string;
}

interface EventInfo {
  date?: string | null;
  location?: string | null;
}

interface Individual extends IndividualInFamily {
  birth?: EventInfo;
  death?: EventInfo;
  families: FamilyInIndividual[];
}

export interface FamilyTree {
  individuals: Individual[];
  families: Family[];
}

export async function processGed(pathToGed: string): Promise<FamilyTree> {
  let parsingOptions = new ParsingOptions();
  parsingOptions.SetFilePath(pathToGed);
  parsingOptions.SetConfigFile(
    "./node_modules/gedcom.json/options/version551.yaml",
  );

  let parse = new JsonParsing(parsingOptions);
  const parseResult = await parse.ParseFileAsync();

  const individualsProcessed: Individual[] = [];
  const familiesProcessed: Family[] = [];

  const individuals: any[] = (parseResult.Object as any).Individuals;
  const relations: any[] = (parseResult.Object as any).Relations;

  const createSimplifiedIds = function (arr: any[], prefix: string) {
    let id = 0;

    return arr.map((x) => {
      id += 1;
      return {
        original_id: x.Id,
        id: `${prefix}${id}`,
      };
    });
  };

  const simplifiedIndividualIds = createSimplifiedIds(individuals, "I");
  const simplifiedFamilyIds = createSimplifiedIds(relations, "F");

  const getSimplifiedIndividualId = (individualId: string) => {
    const id =
      simplifiedIndividualIds.find((x) => x.original_id === individualId)?.id ??
      null;
    if (id == null) {
      throw new Error(`couldn't find individual ID that should be mapped`);
    }

    return id;
  };

  const getSimplifiedFamilyId = (familyId: string) => {
    const id =
      simplifiedFamilyIds.find((x) => x.original_id === familyId)?.id ?? null;
    if (id == null) {
      throw new Error(`couldn't find fmaily ID that should be mapped`);
    }

    return id;
  };

  const getItemAsArray = (item: any) => {
    return Array.isArray(item) ? item : [item];
  };

  const findRelation = (relationId: string) => {
    return relations.find((x) => x.Id === relationId);
  };

  const findIndividual = (individualId: string) => {
    return individuals.find((x) => x.Id === individualId);
  };

  const findPositionInFamily = (simpleIndividualId: string, family: Family) => {
    try {
      for (const position of family.positions) {
        if (
          position.individuals.find(
            (x) => x.individual_id === simpleIndividualId,
          )
        ) {
          switch (position.name) {
            case "Children":
              return "Child";
            default:
              return position.name;
          }
        }
      }

      return "Unknown";
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const generateFamilyName = (relation: any) => {
    return _(relation)
      .keys()
      .map((x) => {
        if (x === "Id" || x === "Children") {
          return null;
        }
        return x;
      })
      .filter((x) => x != null)
      .sort((x, y) => {
        if (x === "Husband") {
          return -1;
        }
        return 1;
      })
      .map((x) => {
        return findIndividual(relation[x!]);
      })
      .filter((x) => !!x)
      .map((individual) => {
        return individual.Surname;
      })
      .join(" and ");
  };

  const getIndividualFullNames = (individual: any) => {
    const fullnameArray = getItemAsArray(individual.Fullname);

    const names = fullnameArray.map((x) => {
      if (typeof x === "string") {
        return x;
      }

      if (typeof x.Value === "string") {
        return x.Value;
      }

      throw new Error(`couldn't extract fullname of individual`);
    });

    return _.uniq(names);
  };

  for (const relation of relations) {
    const familyResult: Family = {
      family_id: getSimplifiedFamilyId(relation.Id),
      family_name: generateFamilyName(relation),
      positions: [],
      descriptions: [],
    };

    for (const key of Object.keys(relation)) {
      const value: any = getItemAsArray(relation[key]);

      if (key === "Id") {
        continue;
      }

      if (key === "Marriage") {
        familyResult.descriptions.push(
          `Marriage date is ${value[0]?.Date?.Original} at ${value[0]?.Place}`,
        );
        continue;
      }

      const positionResult: FamilyPosition = {
        name: key,
        individuals: value.map((x: any) => {
          const individual = findIndividual(x);
          return {
            individual_id: getSimplifiedIndividualId(individual.Id),
            names: getIndividualFullNames(individual),
          };
        }),
      };

      familyResult.positions.push(positionResult);
    }

    familiesProcessed.push(familyResult);
  }

  for (const individual of individuals) {
    const simplifiedIndividualId = getSimplifiedIndividualId(individual.Id);

    const individualResult: Individual = {
      individual_id: simplifiedIndividualId,
      names: getIndividualFullNames(individual),
      families: [],
    };

    if (individual.Birth) {
      individualResult.birth = {
        date: individual.Birth?.Date?.Original ?? "Unknown",
        location: individual.Birth?.Place ?? "Unknown",
      };
    }

    if (individual.Death) {
      individualResult.death = {
        date: individual.Death?.Date?.Original ?? "Unknown",
        location: individual.Death?.Place ?? "Unknown",
      };
    }

    const relations = getItemAsArray(individual.Relations);
    for (const relationId of relations) {
      const simplifiedFamilyId = getSimplifiedFamilyId(relationId);
      const family = familiesProcessed.find(
        (x) => x.family_id === simplifiedFamilyId,
      );

      if (!family) {
        console.error(
          `couldn't find family. relationid=${relationId}, simplifiedFamilyId=${simplifiedFamilyId}`,
        );
        continue;
      }

      const familyResult: FamilyInIndividual = {
        ...family,
        position_of_individual: findPositionInFamily(
          simplifiedIndividualId,
          family,
        ),
      };

      individualResult.families.push(familyResult);
    }

    individualsProcessed.push(individualResult);
  }

  return {
    individuals: individualsProcessed,
    families: familiesProcessed,
  };
}
