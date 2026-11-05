import { peopleRepo } from "./people.repo";

export const peopleService = {
  list: peopleRepo.list,
  getById: peopleRepo.getById,
  getRelationsOf: peopleRepo.getRelationsOf,
};
