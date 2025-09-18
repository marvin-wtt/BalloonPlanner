from typing import TypedDict, NotRequired, Literal, Union


class VehicleBase(TypedDict):
    id: str
    maxCapacity: int
    allowedOperatorIds: list[str]
    kind: Literal["balloon", "car"]


class BalloonV(VehicleBase):
    kind: Literal["balloon"]
    maxWeight: NotRequired[int]


class CarV(VehicleBase):
    kind: Literal["car"]


Vehicle = Union[BalloonV, CarV]


class Balloon(TypedDict):
    id: str
    maxCapacity: int
    allowedOperatorIds: list[str]
    maxWeight: NotRequired[int]


class Car(TypedDict):
    id: str
    maxCapacity: int
    allowedOperatorIds: list[str]
    hasTrailerClutch: NotRequired[bool]


class Person(TypedDict):
    id: str
    role: Literal["participant", "counselor"]
    flightsSoFar: int
    languages: list[str] | None
    nationality: str | None
    firstTime: bool | None
    weight: NotRequired[int]


class VehicleAssignment(TypedDict):
    operatorId: str | None
    passengerIds: list[str]
