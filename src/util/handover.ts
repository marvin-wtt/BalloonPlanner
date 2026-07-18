import type { FlightLeg, FlightSeries, ID } from '@/../src-common/entities';

/**
 * A person moving into or out of a group between two consecutive legs.
 * `otherGroup` is the index of the group on the *other* side of the move
 * (destination for `leaving`, source for `joining`), or `null` when the person
 * is not assigned to any group in that leg (leaving the flight / new to it).
 */
export interface HandoverMove {
  personId: ID;
  otherGroup: number | null;
}

export interface GroupHandover {
  leaving: HandoverMove[];
  joining: HandoverMove[];
}

/**
 * Map every assigned person (operators included) to the index of the vehicle
 * group they belong to in the given leg. Group index matches the position in
 * `series.vehicleGroups`, i.e. the same index used by `vehicleGroupLabel`.
 */
export function groupMembershipByLeg(
  series: FlightSeries,
  leg: FlightLeg,
): Map<ID, number> {
  const membership = new Map<ID, number>();

  series.vehicleGroups.forEach((group, groupIndex) => {
    const vehicleIds = [group.balloonId, ...group.carIds];
    for (const vehicleId of vehicleIds) {
      const assignment = leg.assignments[vehicleId];
      if (!assignment) {
        continue;
      }

      if (assignment.operatorId) {
        membership.set(assignment.operatorId, groupIndex);
      }
      for (const passengerId of assignment.passengerIds) {
        membership.set(passengerId, groupIndex);
      }
    }
  });

  return membership;
}

/**
 * Compute who leaves and who joins the given group between the current leg and
 * the next one. Returns `null` when there is no next leg (nothing to hand over).
 */
export function computeGroupHandover(
  series: FlightSeries,
  legId: ID,
  groupIndex: number,
): GroupHandover | null {
  const legIndex = series.legs.findIndex((l) => l.id === legId);
  const currentLeg = series.legs[legIndex];
  const nextLeg = series.legs[legIndex + 1];
  if (!currentLeg || !nextLeg) {
    return null;
  }

  const current = groupMembershipByLeg(series, currentLeg);
  const next = groupMembershipByLeg(series, nextLeg);

  const leaving: HandoverMove[] = [];
  for (const [personId, group] of current) {
    if (group !== groupIndex) {
      continue;
    }
    const nextGroup = next.get(personId) ?? null;
    if (nextGroup !== groupIndex) {
      leaving.push({ personId, otherGroup: nextGroup });
    }
  }

  const joining: HandoverMove[] = [];
  for (const [personId, group] of next) {
    if (group !== groupIndex) {
      continue;
    }
    const currentGroup = current.get(personId) ?? null;
    if (currentGroup !== groupIndex) {
      joining.push({ personId, otherGroup: currentGroup });
    }
  }

  return { leaving, joining };
}
