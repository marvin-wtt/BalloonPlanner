from typing import TypedDict, NotRequired, Literal, Union, Optional


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
    name: str
    maxCapacity: int
    allowedOperatorIds: list[str]
    maxWeight: NotRequired[int]


class Car(TypedDict):
    id: str
    name: str
    maxCapacity: int
    allowedOperatorIds: list[str]
    hasTrailerClutch: NotRequired[bool]


class Person(TypedDict):
    id: str
    role: Literal["participant", "counselor"]
    flightsSoFar: int
    languages: NotRequired[list[str]]
    nationality: NotRequired[str]
    firstTime: NotRequired[bool]
    weight: NotRequired[int]


class VehicleAssignment(TypedDict):
    operatorId: Optional[str]
    passengerIds: list[str]
